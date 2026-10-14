BEGIN;
CREATE TYPE "TeamRole" AS ENUM ('MEMBER','OBSERVER');
ALTER TABLE team_memberships ADD COLUMN team_role "TeamRole" NOT NULL DEFAULT 'MEMBER', ADD COLUMN joined_at timestamptz(3);
ALTER TABLE team_memberships ALTER COLUMN joined_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE teams ADD COLUMN directory_revision bigint NOT NULL DEFAULT 1 CHECK(directory_revision>0);
CREATE TABLE team_transfer_intents (
 workspace_id uuid NOT NULL, team_id uuid NOT NULL, request_id uuid NOT NULL,
 initiator_membership_id uuid NOT NULL, successor_membership_id uuid NOT NULL,
 initiator_user_id uuid NOT NULL, successor_user_id uuid NOT NULL, source_family_id uuid NOT NULL,
 initiator_epoch bigint NOT NULL, successor_epoch bigint NOT NULL, base_version bigint NOT NULL, policy_revision bigint NOT NULL,
 revision bigint NOT NULL DEFAULT 1, state varchar(12) NOT NULL, issued_at timestamptz(3) NOT NULL, expires_at timestamptz(3) NOT NULL,
 CONSTRAINT team_transfer_intents_pkey PRIMARY KEY(workspace_id,team_id),
 CONSTRAINT team_transfer_intents_request_id_key UNIQUE(request_id),
 CONSTRAINT team_transfer_intents_workspace_id_team_id_fkey FOREIGN KEY(workspace_id,team_id) REFERENCES teams(workspace_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT transfer_initiator_fk FOREIGN KEY(workspace_id,initiator_membership_id,initiator_user_id) REFERENCES workspace_memberships(workspace_id,id,user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT transfer_successor_fk FOREIGN KEY(workspace_id,successor_membership_id,successor_user_id) REFERENCES workspace_memberships(workspace_id,id,user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT team_transfer_intents_source_family_id_fkey FOREIGN KEY(source_family_id) REFERENCES auth_session_families(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT transfer_bounds CHECK (initiator_membership_id<>successor_membership_id AND initiator_user_id<>successor_user_id AND initiator_epoch>0 AND successor_epoch>0 AND base_version>0 AND policy_revision>0 AND revision>0 AND state IN ('PENDING','ACCEPTED','REJECTED','EXPIRED','INVALIDATED') AND expires_at>issued_at AND expires_at<=issued_at+interval '15 minutes')
);
-- Expression index matches nullable historical timestamp traversal, not invented dates.
CREATE INDEX team_membership_directory_idx ON team_memberships(workspace_id,team_id,COALESCE(joined_at,'-infinity'::timestamptz),membership_id);
CREATE OR REPLACE FUNCTION guard_team_foundation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.legacy_quarantined OR NEW.owner_membership_id IS NULL OR NOT EXISTS(SELECT 1 FROM workspace_memberships WHERE workspace_id=NEW.workspace_id AND id=NEW.owner_membership_id AND status='ACTIVE' AND role='ADMIN') THEN RAISE EXCEPTION 'Team requires eligible owner' USING ERRCODE='23514'; END IF;
 ELSE
  IF NEW.key IS DISTINCT FROM OLD.key OR NEW.legacy_quarantined IS DISTINCT FROM OLD.legacy_quarantined OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Team binding immutable' USING ERRCODE='23514'; END IF;
  IF (NEW.name,NEW.description,NEW.color,NEW.owner_membership_id,NEW.status,NEW.directory_revision) IS DISTINCT FROM (OLD.name,OLD.description,OLD.color,OLD.owner_membership_id,OLD.status,OLD.directory_revision) THEN
   IF OLD.legacy_quarantined OR NEW.version<>OLD.version+1 OR NEW.directory_revision<OLD.directory_revision OR NEW.directory_revision>OLD.directory_revision+1 OR (OLD.status<>'ACTIVE' AND (NEW.name,NEW.description,NEW.color,NEW.owner_membership_id) IS DISTINCT FROM (OLD.name,OLD.description,OLD.color,OLD.owner_membership_id)) THEN RAISE EXCEPTION 'Team requires valid version transition' USING ERRCODE='23514'; END IF;
  ELSIF NEW.version<>OLD.version THEN RAISE EXCEPTION 'Version requires effect' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION check_team_owner_ceiling() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ws uuid; tid uuid;
BEGIN
 IF TG_TABLE_NAME='teams' THEN ws:=NEW.workspace_id; tid:=NEW.id; ELSIF TG_OP='DELETE' THEN ws:=OLD.workspace_id;tid:=OLD.team_id; ELSE ws:=NEW.workspace_id;tid:=NEW.team_id; END IF;
 IF EXISTS(SELECT 1 FROM teams t LEFT JOIN team_memberships tm ON tm.workspace_id=t.workspace_id AND tm.team_id=t.id AND tm.membership_id=t.owner_membership_id WHERE t.workspace_id=ws AND t.id=tid AND NOT t.legacy_quarantined AND (tm.membership_id IS NULL OR tm.team_role<>'MEMBER')) THEN RAISE EXCEPTION 'Owner requires explicit MEMBER join' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER team_owner_ceiling AFTER INSERT OR UPDATE ON teams DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_team_owner_ceiling();
CREATE CONSTRAINT TRIGGER join_owner_ceiling AFTER INSERT OR UPDATE OR DELETE ON team_memberships DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_team_owner_ceiling();
CREATE FUNCTION guard_team_join_management() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ws uuid; tid uuid;
BEGIN
 IF TG_OP='DELETE' THEN ws:=OLD.workspace_id;tid:=OLD.team_id; ELSE ws:=NEW.workspace_id;tid:=NEW.team_id; END IF;
 IF TG_OP='UPDATE' AND (NEW.team_id,NEW.membership_id,NEW.joined_at) IS DISTINCT FROM (OLD.team_id,OLD.membership_id,OLD.joined_at) THEN RAISE EXCEPTION 'Join binding immutable' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM teams WHERE workspace_id=ws AND id=tid AND (status<>'ACTIVE' OR legacy_quarantined)) THEN RAISE EXCEPTION 'Team joins read only' USING ERRCODE='23514'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER b_team_join_management BEFORE INSERT OR UPDATE OR DELETE ON team_memberships FOR EACH ROW EXECUTE FUNCTION guard_team_join_management();
-- SQL ownership transitions require the exact accepted current intent; no role/status CHECK vetoes revocation.
CREATE FUNCTION complete_team_transfer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.owner_membership_id IS DISTINCT FROM OLD.owner_membership_id AND NOT EXISTS(SELECT 1 FROM team_transfer_intents i WHERE i.workspace_id=NEW.workspace_id AND i.team_id=NEW.id AND i.state='ACCEPTED' AND i.initiator_membership_id=OLD.owner_membership_id AND i.successor_membership_id=NEW.owner_membership_id AND i.base_version=OLD.version) THEN RAISE EXCEPTION 'Owner change requires accepted consent' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER team_transfer_complete AFTER UPDATE ON teams DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION complete_team_transfer();
CREATE FUNCTION guard_transfer_intent() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' AND NEW.state<>'PENDING' THEN RAISE EXCEPTION 'Consent begins pending' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Intent replaced only by bounded state transition' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' THEN
  IF (NEW.workspace_id,NEW.team_id) IS DISTINCT FROM (OLD.workspace_id,OLD.team_id) OR NEW.revision<>OLD.revision+1 THEN RAISE EXCEPTION 'Intent revision/binding invalid' USING ERRCODE='23514'; END IF;
  IF NEW.request_id=OLD.request_id THEN
   IF (NEW.initiator_membership_id,NEW.successor_membership_id,NEW.initiator_user_id,NEW.successor_user_id,NEW.source_family_id,NEW.initiator_epoch,NEW.successor_epoch,NEW.base_version,NEW.policy_revision,NEW.issued_at,NEW.expires_at) IS DISTINCT FROM (OLD.initiator_membership_id,OLD.successor_membership_id,OLD.initiator_user_id,OLD.successor_user_id,OLD.source_family_id,OLD.initiator_epoch,OLD.successor_epoch,OLD.base_version,OLD.policy_revision,OLD.issued_at,OLD.expires_at) OR OLD.state<>'PENDING' OR NEW.state NOT IN ('ACCEPTED','REJECTED','EXPIRED','INVALIDATED') THEN RAISE EXCEPTION 'Consent immutable/terminal' USING ERRCODE='23514'; END IF;
  ELSIF OLD.state='PENDING' OR NEW.state<>'PENDING' THEN RAISE EXCEPTION 'Pending consent cannot be replaced' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.state='PENDING' AND (TG_OP='INSERT' OR NEW.request_id IS DISTINCT FROM OLD.request_id) AND NOT EXISTS(
 SELECT 1 FROM teams t JOIN workspaces w ON w.id=t.workspace_id JOIN workspace_policy_revisions p ON p.workspace_id=t.workspace_id
 JOIN workspace_memberships im ON im.workspace_id=t.workspace_id AND im.id=NEW.initiator_membership_id AND im.user_id=NEW.initiator_user_id
 JOIN workspace_memberships sm ON sm.workspace_id=t.workspace_id AND sm.id=NEW.successor_membership_id AND sm.user_id=NEW.successor_user_id
 JOIN team_memberships it ON it.workspace_id=t.workspace_id AND it.team_id=t.id AND it.membership_id=im.id
 JOIN team_memberships st ON st.workspace_id=t.workspace_id AND st.team_id=t.id AND st.membership_id=sm.id
 JOIN users iu ON iu.id=im.user_id JOIN users su ON su.id=sm.user_id JOIN auth_session_families f ON f.id=NEW.source_family_id AND f.user_id=iu.id
 WHERE t.workspace_id=NEW.workspace_id AND t.id=NEW.team_id AND NOT t.legacy_quarantined AND t.status='ACTIVE' AND w.status='ACTIVE'
 AND t.owner_membership_id=im.id AND t.version=NEW.base_version AND p.revision=NEW.policy_revision
 AND im.role='ADMIN' AND im.status='ACTIVE' AND sm.role='ADMIN' AND sm.status='ACTIVE' AND it.team_role='MEMBER' AND st.team_role='MEMBER'
 AND NOT iu.auth_disabled AND NOT su.auth_disabled AND iu.auth_epoch=NEW.initiator_epoch AND su.auth_epoch=NEW.successor_epoch
 AND f.auth_epoch=iu.auth_epoch AND f.revoked_at IS NULL AND f.absolute_expires_at>clock_timestamp() AND f.idle_expires_at>clock_timestamp() AND NEW.issued_at<=clock_timestamp()
 ) THEN RAISE EXCEPTION 'Consent requires exact eligible bindings' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER a_tenant_write BEFORE INSERT OR UPDATE ON team_transfer_intents FOR EACH ROW EXECUTE FUNCTION guard_tenant_write();
CREATE TRIGGER a_transfer_intent BEFORE INSERT OR UPDATE OR DELETE ON team_transfer_intents FOR EACH ROW EXECUTE FUNCTION guard_transfer_intent();
ALTER TABLE team_mutation_results ADD COLUMN http_status integer CHECK(http_status IN (200,201)), ADD COLUMN intent_revision bigint CHECK(intent_revision>0);
ALTER TABLE team_mutation_results DROP CONSTRAINT team_receipt_fields;
ALTER TABLE team_mutation_results ADD CONSTRAINT team_receipt_fields CHECK(operation IN ('team:create:v1','team:update:v1','team:add:v1','team:remove:v1','team:role:v1','team:request:v1','team:accept:v1','team:reject:v1','team:archive:v1','team:restore:v1') AND payload_digest ~ '^[0-9a-f]{64}$' AND retain_until>=completed_at+interval '24 hours' AND (result IS NULL OR octet_length(result::text)<=16384));
CREATE FUNCTION advance_team_join_version() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ws uuid; tid uuid; member uuid;
BEGIN
 IF TG_OP='DELETE' THEN ws:=OLD.workspace_id;tid:=OLD.team_id;member:=OLD.membership_id; ELSE ws:=NEW.workspace_id;tid:=NEW.team_id;member:=NEW.membership_id; END IF;
 IF TG_OP='UPDATE' AND NEW.team_role=OLD.team_role THEN RETURN NULL; END IF;
 -- Initial atomic creator join preserves BE-TEAM-01 resource version1.
 IF TG_OP='INSERT' AND EXISTS(SELECT 1 FROM teams WHERE workspace_id=ws AND id=tid AND version=1 AND owner_membership_id=member) AND (SELECT count(*) FROM team_memberships WHERE workspace_id=ws AND team_id=tid)=1 THEN RETURN NULL; END IF;
 UPDATE teams SET version=version+1,directory_revision=directory_revision+1 WHERE workspace_id=ws AND id=tid;
 RETURN NULL;
END $$;
CREATE TRIGGER team_join_version AFTER INSERT OR UPDATE OR DELETE ON team_memberships FOR EACH ROW EXECUTE FUNCTION advance_team_join_version();
CREATE FUNCTION complete_transfer_intent() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_intent team_transfer_intents%ROWTYPE;
BEGIN
 SELECT * INTO current_intent FROM team_transfer_intents WHERE workspace_id=NEW.workspace_id AND team_id=NEW.team_id;
 IF current_intent.request_id<>NEW.request_id THEN RETURN NULL; END IF;
 IF NEW.state='ACCEPTED' AND NOT EXISTS(
 SELECT 1 FROM teams t JOIN workspaces w ON w.id=t.workspace_id
 JOIN workspace_memberships im ON im.workspace_id=t.workspace_id AND im.id=NEW.initiator_membership_id
 JOIN workspace_memberships sm ON sm.workspace_id=t.workspace_id AND sm.id=NEW.successor_membership_id
 JOIN users iu ON iu.id=im.user_id JOIN users su ON su.id=sm.user_id
 JOIN auth_session_families f ON f.id=NEW.source_family_id AND f.user_id=iu.id
 JOIN team_memberships it ON it.workspace_id=t.workspace_id AND it.team_id=t.id AND it.membership_id=im.id
 JOIN team_memberships st ON st.workspace_id=t.workspace_id AND st.team_id=t.id AND st.membership_id=sm.id
 JOIN team_mutation_results r ON r.workspace_id=t.workspace_id AND r.team_id=t.id AND r.actor_id=su.id AND r.operation='team:accept:v1'
 WHERE t.workspace_id=NEW.workspace_id AND t.id=NEW.team_id AND t.owner_membership_id=sm.id AND t.version=NEW.base_version+1
 AND t.status='ACTIVE' AND w.status='ACTIVE' AND im.status='ACTIVE' AND im.role='ADMIN' AND sm.status='ACTIVE' AND sm.role='ADMIN'
 AND it.team_role='MEMBER' AND st.team_role='MEMBER' AND NOT iu.auth_disabled AND NOT su.auth_disabled AND iu.auth_epoch=NEW.initiator_epoch AND su.auth_epoch=NEW.successor_epoch
 AND f.auth_epoch=iu.auth_epoch AND f.revoked_at IS NULL AND f.absolute_expires_at>clock_timestamp() AND f.idle_expires_at>clock_timestamp() AND NEW.expires_at>clock_timestamp()
 AND r.result->>'requestId'=NEW.request_id::text AND r.result->>'outcome'='ACCEPTED' AND r.result->>'version'=t.version::text
 ) THEN RAISE EXCEPTION 'Accepted intent requires atomic authorized owner/receipt' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER transfer_intent_complete AFTER INSERT OR UPDATE ON team_transfer_intents DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION complete_transfer_intent();
CREATE FUNCTION guard_team_receipt_status() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.intent_revision IS DISTINCT FROM OLD.intent_revision THEN RAISE EXCEPTION 'Original intent revision immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND NEW.http_status IS DISTINCT FROM OLD.http_status AND (OLD.http_status IS NOT NULL OR OLD.result IS NOT NULL OR OLD.retain_until<=statement_timestamp()) THEN RAISE EXCEPTION 'Receipt HTTP result immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER team_receipt_status BEFORE UPDATE ON team_mutation_results FOR EACH ROW EXECUTE FUNCTION guard_team_receipt_status();
CREATE FUNCTION complete_team_receipt_status() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM team_mutation_results WHERE id=NEW.id AND operation NOT IN ('team:create:v1','team:update:v1') AND http_status IS NULL) THEN RAISE EXCEPTION 'Management receipt status required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER team_receipt_status_complete AFTER INSERT OR UPDATE ON team_mutation_results DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION complete_team_receipt_status();
COMMIT;
