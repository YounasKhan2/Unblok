BEGIN;
CREATE TABLE workspace_policy_revisions (
 workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0)
);
INSERT INTO workspace_policy_revisions(workspace_id) SELECT id FROM workspaces;
CREATE FUNCTION initialize_workspace_policy_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN INSERT INTO workspace_policy_revisions(workspace_id) VALUES(NEW.id); RETURN NEW; END $$;
CREATE TRIGGER workspace_policy_initialize AFTER INSERT ON workspaces FOR EACH ROW EXECUTE FUNCTION initialize_workspace_policy_revision();
CREATE FUNCTION advance_workspace_policy_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 UPDATE workspace_policy_revisions SET revision=revision+1 WHERE workspace_id=CASE WHEN TG_OP='DELETE' THEN OLD.workspace_id ELSE NEW.workspace_id END;
 IF NOT FOUND THEN RAISE EXCEPTION 'Missing policy authority' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER workspace_policy_membership AFTER INSERT OR UPDATE OR DELETE ON workspace_memberships FOR EACH ROW EXECUTE FUNCTION advance_workspace_policy_revision();
CREATE INDEX workspace_memberships_directory_idx ON workspace_memberships(workspace_id, status, joined_at, id);
CREATE UNIQUE INDEX workspace_membership_inviter_binding ON workspace_memberships(workspace_id,id,user_id);
CREATE TABLE workspace_invitations (
 id uuid PRIMARY KEY, workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 inviter_id uuid NOT NULL, inviter_identity_id uuid NOT NULL, inviter_membership_id uuid NOT NULL,
 inviter_epoch bigint NOT NULL CHECK(inviter_epoch>0), email varchar(320) NOT NULL CHECK(email=lower(btrim(email))),
 role "WorkspaceRole" NOT NULL CHECK(role IN ('MEMBER','OBSERVER')), key_id varchar(40) NOT NULL CHECK(key_id ~ '^[a-z0-9-]{1,40}$'),
 token_digest varchar(64) NOT NULL CHECK(token_digest ~ '^[0-9a-f]{64}$'),
 issued_at timestamptz(3) NOT NULL, expires_at timestamptz(3) NOT NULL,
 consumed_at timestamptz(3), canceled_at timestamptz(3), attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 10),
 CHECK(expires_at>issued_at AND expires_at<=issued_at+interval '24 hours'),
 CHECK(consumed_at IS NULL OR (consumed_at>=issued_at AND consumed_at<expires_at AND canceled_at IS NULL)),
 CHECK(canceled_at IS NULL OR canceled_at>=issued_at),
 FOREIGN KEY(inviter_identity_id,inviter_id) REFERENCES identities(id,user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(workspace_id,inviter_membership_id,inviter_id) REFERENCES workspace_memberships(workspace_id,id,user_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX workspace_invitations_workspace_id_email_expires_at_idx ON workspace_invitations(workspace_id,email,expires_at);
CREATE UNIQUE INDEX workspace_invitation_pending_email ON workspace_invitations(workspace_id,email) WHERE consumed_at IS NULL AND canceled_at IS NULL;
CREATE FUNCTION protect_workspace_invitation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-'attempts'-'consumed_at'-'canceled_at') IS DISTINCT FROM (to_jsonb(OLD)-'attempts'-'consumed_at'-'canceled_at')
 OR NEW.attempts<OLD.attempts OR NEW.attempts>OLD.attempts+1 OR (OLD.consumed_at IS NOT NULL AND NEW IS DISTINCT FROM OLD)
 OR (OLD.canceled_at IS NOT NULL AND NEW IS DISTINCT FROM OLD) THEN RAISE EXCEPTION 'Invitation authority is immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER workspace_invitation_immutable BEFORE UPDATE OR DELETE ON workspace_invitations FOR EACH ROW EXECUTE FUNCTION protect_workspace_invitation();
CREATE TABLE workspace_invitation_outbox (
 invitation_id uuid PRIMARY KEY REFERENCES workspace_invitations(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5), next_attempt_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 lease_id uuid, lease_until timestamptz(3), delivered_at timestamptz(3), CHECK((lease_id IS NULL)=(lease_until IS NULL))
);
CREATE TABLE workspace_invitation_results (
 actor_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 operation varchar(40) NOT NULL CHECK(operation IN ('workspace:invite:v1','invitation:accept:v1')),
 request_key uuid NOT NULL, payload_digest varchar(64) NOT NULL CHECK(payload_digest ~ '^[0-9a-f]{64}$'),
 completed_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(actor_id,operation,request_key)
);
CREATE FUNCTION protect_workspace_invitation_result() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Invitation receipt is immutable' USING ERRCODE='23514'; END $$;
CREATE TRIGGER workspace_invitation_result_immutable BEFORE UPDATE OR DELETE ON workspace_invitation_results FOR EACH ROW EXECUTE FUNCTION protect_workspace_invitation_result();
CREATE FUNCTION invalidate_workspace_invitations() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_TABLE_NAME='workspaces' THEN
  IF NEW.status IS DISTINCT FROM OLD.status THEN UPDATE workspace_policy_revisions SET revision=revision+1 WHERE workspace_id=NEW.id; END IF;
  IF NEW.status='ARCHIVED' THEN UPDATE workspace_invitations SET canceled_at=clock_timestamp() WHERE workspace_id=NEW.id AND consumed_at IS NULL AND canceled_at IS NULL; END IF;
 ELSE
  IF NEW.status<>'ACTIVE' OR NEW.role<>'ADMIN' THEN UPDATE workspace_invitations SET canceled_at=clock_timestamp() WHERE workspace_id=NEW.workspace_id AND inviter_membership_id=NEW.id AND consumed_at IS NULL AND canceled_at IS NULL; END IF;
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER workspace_invitation_archive AFTER UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION invalidate_workspace_invitations();
CREATE TRIGGER workspace_invitation_inviter AFTER UPDATE ON workspace_memberships FOR EACH ROW EXECUTE FUNCTION invalidate_workspace_invitations();
COMMIT;
