BEGIN;
ALTER TABLE workspace_memberships ADD COLUMN removed_at timestamptz(3), ADD COLUMN administration_version bigint NOT NULL DEFAULT 1 CHECK(administration_version>0), ADD CONSTRAINT membership_removal_state CHECK(removed_at IS NULL OR status='SUSPENDED');
CREATE FUNCTION protect_membership_removal() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.removed_at IS NOT NULL AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.removed_at IS DISTINCT FROM OLD.removed_at OR NEW.role IS DISTINCT FROM OLD.role) THEN RAISE EXCEPTION 'Removed membership is terminal' USING ERRCODE='23514'; END IF;
 IF (NEW.role,NEW.status,NEW.removed_at) IS DISTINCT FROM (OLD.role,OLD.status,OLD.removed_at) THEN
  NEW.administration_version=OLD.administration_version+1;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER membership_removal_guard BEFORE UPDATE ON workspace_memberships FOR EACH ROW EXECUTE FUNCTION protect_membership_removal();
ALTER TABLE workspace_invitations ADD COLUMN proof_version integer NOT NULL DEFAULT 1 CHECK(proof_version IN(1,2)), ADD COLUMN assignment_digest varchar(64), ADD COLUMN previous_id uuid UNIQUE, ADD COLUMN created_transaction bigint NOT NULL DEFAULT txid_current();
ALTER TABLE workspace_invitations DROP CONSTRAINT workspace_invitations_role_check;
ALTER TABLE workspace_invitations ADD CONSTRAINT invitation_version_role CHECK((proof_version=1 AND role IN('MEMBER','OBSERVER') AND assignment_digest IS NULL AND previous_id IS NULL) OR (proof_version=2 AND assignment_digest ~ '^[0-9a-f]{64}$'));
ALTER TABLE workspace_invitations ADD CONSTRAINT invitation_scoped_id UNIQUE(workspace_id,id), ADD CONSTRAINT invitation_previous_fk FOREIGN KEY(workspace_id,previous_id) REFERENCES workspace_invitations(workspace_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE TABLE workspace_invitation_teams(
 workspace_id uuid NOT NULL, invitation_id uuid NOT NULL, team_id uuid NOT NULL, team_version bigint NOT NULL CHECK(team_version>0),
 PRIMARY KEY(workspace_id,invitation_id,team_id),
 FOREIGN KEY(workspace_id,invitation_id) REFERENCES workspace_invitations(workspace_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(workspace_id,team_id) REFERENCES teams(workspace_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE FUNCTION protect_invitation_team_plan() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP<>'INSERT' OR NOT EXISTS(SELECT 1 FROM workspace_invitations WHERE id=NEW.invitation_id AND workspace_id=NEW.workspace_id AND proof_version=2 AND created_transaction=txid_current() AND consumed_at IS NULL AND canceled_at IS NULL) THEN RAISE EXCEPTION 'Immutable invitation plan' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER invitation_team_plan_guard BEFORE INSERT OR UPDATE OR DELETE ON workspace_invitation_teams FOR EACH ROW EXECUTE FUNCTION protect_invitation_team_plan();
CREATE FUNCTION validate_invitation_plan() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actual text; n integer;
BEGIN
 IF NEW.proof_version=2 THEN
  SELECT encode(sha256(convert_to(COALESCE(string_agg(team_id::text||':'||team_version::text,',' ORDER BY team_id),''),'UTF8')),'hex'),count(*) INTO actual,n FROM workspace_invitation_teams WHERE workspace_id=NEW.workspace_id AND invitation_id=NEW.id;
  IF actual<>NEW.assignment_digest OR n>20 THEN RAISE EXCEPTION 'Invalid invitation plan' USING ERRCODE='23514'; END IF;
 END IF; RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER invitation_plan_binding AFTER INSERT ON workspace_invitations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_invitation_plan();
ALTER TABLE workspace_invitation_results DROP CONSTRAINT workspace_invitation_results_operation_check;
ALTER TABLE workspace_invitation_results ADD CONSTRAINT invitation_result_operations CHECK(operation IN('workspace:invite:v1','invitation:accept:v1','administration:invite:v2','administration:resend:v2','administration:revoke:v2','administration:role:v2','administration:remove:v2'));
CREATE TABLE workspace_administration_revisions(workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE RESTRICT ON UPDATE RESTRICT,revision bigint NOT NULL DEFAULT 1 CHECK(revision>0));
INSERT INTO workspace_administration_revisions(workspace_id) SELECT id FROM workspaces;
CREATE FUNCTION administration_initialize() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO workspace_administration_revisions(workspace_id) VALUES(NEW.id); RETURN NEW; END $$;
CREATE TRIGGER administration_initialize AFTER INSERT ON workspaces FOR EACH ROW EXECUTE FUNCTION administration_initialize();
CREATE FUNCTION administration_advance() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 UPDATE workspace_administration_revisions SET revision=revision+1 WHERE workspace_id=CASE WHEN TG_OP='DELETE' THEN OLD.workspace_id ELSE NEW.workspace_id END;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER administration_members AFTER INSERT OR UPDATE OR DELETE ON workspace_memberships FOR EACH ROW EXECUTE FUNCTION administration_advance();
CREATE TRIGGER administration_invitations AFTER INSERT OR UPDATE ON workspace_invitations FOR EACH ROW EXECUTE FUNCTION administration_advance();
CREATE FUNCTION administration_advance_delivery() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 UPDATE workspace_administration_revisions SET revision=revision+1 WHERE workspace_id=(SELECT workspace_id FROM workspace_invitations WHERE id=NEW.invitation_id); RETURN NEW;
END $$;
CREATE TRIGGER administration_delivery AFTER INSERT OR UPDATE ON workspace_invitation_outbox FOR EACH ROW EXECUTE FUNCTION administration_advance_delivery();
CREATE TRIGGER administration_teams AFTER INSERT OR UPDATE OR DELETE ON teams FOR EACH ROW EXECUTE FUNCTION administration_advance();
CREATE TRIGGER administration_team_members AFTER INSERT OR UPDATE OR DELETE ON team_memberships FOR EACH ROW EXECUTE FUNCTION administration_advance();
CREATE FUNCTION administration_profile_advance() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (NEW.name,NEW.email) IS DISTINCT FROM (OLD.name,OLD.email) THEN
  UPDATE workspace_administration_revisions SET revision=revision+1 WHERE workspace_id IN(SELECT workspace_id FROM workspace_memberships WHERE user_id=NEW.id);
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER administration_profiles AFTER UPDATE ON users FOR EACH ROW EXECUTE FUNCTION administration_profile_advance();
CREATE INDEX administration_members_keyset ON workspace_memberships(workspace_id,(COALESCE(joined_at,'1970-01-01'::timestamptz)),id);
CREATE INDEX administration_invitations_keyset ON workspace_invitations(workspace_id,issued_at,id);
CREATE INDEX administration_invitation_plan_team ON workspace_invitation_teams(workspace_id,team_id,invitation_id);
COMMIT;
