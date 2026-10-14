-- Additive foundation; existing Teams have no authoritative owner and remain quarantined.
BEGIN;
ALTER TABLE teams ADD COLUMN owner_membership_id uuid,
 ADD COLUMN legacy_quarantined boolean NOT NULL DEFAULT true,
 ADD COLUMN version bigint NOT NULL DEFAULT 1,
 ADD COLUMN description varchar(2000) NOT NULL DEFAULT '',
 ADD COLUMN color varchar(7) NOT NULL DEFAULT '#5645d4';
ALTER TABLE teams ALTER COLUMN legacy_quarantined SET DEFAULT false;
ALTER TABLE teams ADD CONSTRAINT team_owner_state CHECK
 ((legacy_quarantined AND owner_membership_id IS NULL) OR (NOT legacy_quarantined AND owner_membership_id IS NOT NULL)),
 ADD CONSTRAINT team_metadata_bounds CHECK (version > 0 AND char_length(name) BETWEEN 1 AND 120 AND octet_length(name)<=480 AND octet_length(description)<=8000
 AND color IN ('#5645d4','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#64748b')),
 ADD CONSTRAINT "teams_workspace_id_id_owner_membership_id_fkey" FOREIGN KEY(workspace_id,id,owner_membership_id)
 REFERENCES team_memberships(workspace_id,team_id,membership_id) ON DELETE RESTRICT ON UPDATE RESTRICT DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX teams_scoped_created_idx ON teams(workspace_id,status,created_at,id);
CREATE FUNCTION guard_team_foundation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.legacy_quarantined OR NEW.owner_membership_id IS NULL OR NOT EXISTS
   (SELECT 1 FROM workspace_memberships WHERE workspace_id=NEW.workspace_id AND id=NEW.owner_membership_id AND status='ACTIVE' AND role='ADMIN') THEN
   RAISE EXCEPTION 'Team requires eligible owner' USING ERRCODE='23514';
  END IF;
 ELSE
  IF NEW.key IS DISTINCT FROM OLD.key OR NEW.owner_membership_id IS DISTINCT FROM OLD.owner_membership_id
    OR NEW.legacy_quarantined IS DISTINCT FROM OLD.legacy_quarantined OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
   RAISE EXCEPTION 'Team foundation binding immutable' USING ERRCODE='23514';
  END IF;
  IF (NEW.name,NEW.description,NEW.color) IS DISTINCT FROM (OLD.name,OLD.description,OLD.color) THEN
   IF OLD.legacy_quarantined OR OLD.status<>'ACTIVE' OR NEW.version<>OLD.version+1 THEN
    RAISE EXCEPTION 'Team metadata requires active version transition' USING ERRCODE='23514';
   END IF;
  ELSIF NEW.version<>OLD.version THEN
   RAISE EXCEPTION 'Version requires metadata mutation' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER b_team_foundation BEFORE INSERT OR UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION guard_team_foundation();
CREATE TRIGGER team_policy_revision AFTER INSERT OR DELETE ON teams FOR EACH ROW EXECUTE FUNCTION advance_workspace_policy_revision();
CREATE TRIGGER team_policy_lifecycle AFTER UPDATE ON teams FOR EACH ROW
 WHEN ((OLD.status,OLD.legacy_quarantined,OLD.owner_membership_id) IS DISTINCT FROM (NEW.status,NEW.legacy_quarantined,NEW.owner_membership_id)) EXECUTE FUNCTION advance_workspace_policy_revision();
CREATE TRIGGER team_membership_policy_revision AFTER INSERT OR UPDATE OR DELETE ON team_memberships FOR EACH ROW EXECUTE FUNCTION advance_workspace_policy_revision();

CREATE TABLE team_mutation_results(
 id uuid PRIMARY KEY,deployment_slot integer NOT NULL DEFAULT 0,workspace_slot integer NOT NULL DEFAULT 0,workspace_id uuid NOT NULL,actor_id uuid NOT NULL,operation varchar(30) NOT NULL,
 request_key uuid NOT NULL,payload_digest varchar(64) NOT NULL,team_id uuid NOT NULL,result jsonb,
 completed_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,retain_until timestamptz(3) NOT NULL,
 CONSTRAINT "team_mutation_results_workspace_id_team_id_fkey" FOREIGN KEY(workspace_id,team_id) REFERENCES teams(workspace_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT DEFERRABLE INITIALLY DEFERRED,
 CONSTRAINT "team_mutation_results_actor_id_fkey" FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT team_receipt_slot_bounds CHECK(deployment_slot BETWEEN 1 AND 20000 AND workspace_slot BETWEEN 1 AND 2000),
 CONSTRAINT team_receipt_fields CHECK(operation IN ('team:create:v1','team:update:v1') AND payload_digest ~ '^[0-9a-f]{64}$'
 AND retain_until>=completed_at+interval '24 hours' AND (result IS NULL OR octet_length(result::text)<=16384)));
CREATE UNIQUE INDEX "team_mutation_results_actor_id_workspace_id_operation_reque_key" ON team_mutation_results(actor_id,workspace_id,operation,request_key);
CREATE UNIQUE INDEX team_receipt_deployment_slot_key ON team_mutation_results(deployment_slot);
CREATE UNIQUE INDEX team_receipt_workspace_slot_key ON team_mutation_results(workspace_id,workspace_slot);
-- Aggregate UNION view is not automatically updatable. There is no writable counter.
CREATE VIEW team_receipt_budgets AS
 SELECT 'deployment'::varchar(50) AS scope,count(*)::integer AS used FROM team_mutation_results
 UNION ALL
 SELECT ('workspace:'||workspace_id)::varchar(50),count(*)::integer FROM team_mutation_results GROUP BY workspace_id;
CREATE FUNCTION guard_team_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE deployed integer; scoped integer;
BEGIN
 IF TG_OP IN ('DELETE','TRUNCATE') THEN RAISE EXCEPTION 'Team receipt retained' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' THEN
  IF (NEW.id,NEW.workspace_id,NEW.actor_id,NEW.operation,NEW.request_key,NEW.payload_digest,NEW.team_id,NEW.completed_at,NEW.retain_until,NEW.deployment_slot,NEW.workspace_slot)
   IS DISTINCT FROM (OLD.id,OLD.workspace_id,OLD.actor_id,OLD.operation,OLD.request_key,OLD.payload_digest,OLD.team_id,OLD.completed_at,OLD.retain_until,OLD.deployment_slot,OLD.workspace_slot)
   OR (OLD.result IS NULL AND OLD.retain_until<=statement_timestamp() AND NEW.result IS NOT NULL)
   OR (OLD.result IS NOT NULL AND NEW.result IS DISTINCT FROM OLD.result AND NOT (NEW.result IS NULL AND OLD.retain_until<=statement_timestamp())) THEN
   RAISE EXCEPTION 'Receipt binding immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
 END IF;
 -- Workspace authorization/lock precedes this database-scoped deployment lock.
 -- The lock orders allocation, not permission. UNIQUE + bounded slot CHECKs
 -- enforce both hard caps even for direct SQL or stale SERIALIZABLE snapshots.
 PERFORM pg_advisory_xact_lock(hashtextextended('unblok:team-receipt-admission:v1',0));
 SELECT COALESCE(max(deployment_slot),0)+1 INTO deployed FROM team_mutation_results;
 SELECT COALESCE(max(workspace_slot),0)+1 INTO scoped FROM team_mutation_results WHERE workspace_id=NEW.workspace_id;
 IF deployed>20000 OR scoped>2000 THEN RAISE EXCEPTION 'Receipt capacity unavailable'; END IF;
 -- Never trust caller-provided allocation fields.
 NEW.deployment_slot:=deployed;
 NEW.workspace_slot:=scoped;
 RETURN NEW;
END $$;
CREATE TRIGGER team_receipt_guard BEFORE INSERT OR UPDATE OR DELETE ON team_mutation_results FOR EACH ROW EXECUTE FUNCTION guard_team_receipt();
CREATE TRIGGER team_receipt_truncate_guard BEFORE TRUNCATE ON team_mutation_results FOR EACH STATEMENT EXECUTE FUNCTION guard_team_receipt();
CREATE FUNCTION complete_team_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM team_mutation_results r LEFT JOIN teams t ON t.workspace_id=r.workspace_id AND t.id=r.team_id
 WHERE r.id=NEW.id AND (t.id IS NULL OR t.legacy_quarantined OR (r.result IS NULL AND r.retain_until>statement_timestamp()))) THEN
 RAISE EXCEPTION 'Incomplete Team receipt' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER team_receipt_complete AFTER INSERT OR UPDATE ON team_mutation_results DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION complete_team_receipt();
COMMIT;
