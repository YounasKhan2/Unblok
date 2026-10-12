BEGIN;
-- Separate from users: revision writes never upgrade the user's auth fence.
CREATE TABLE workspace_discovery_revisions (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0)
);
INSERT INTO workspace_discovery_revisions(user_id) SELECT id FROM users;
CREATE FUNCTION initialize_workspace_discovery_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN INSERT INTO workspace_discovery_revisions(user_id) VALUES (NEW.id); RETURN NEW; END $$;
CREATE TRIGGER workspace_discovery_user AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION initialize_workspace_discovery_revision();
CREATE FUNCTION advance_workspace_discovery_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Membership actor is immutable' USING ERRCODE = '23514';
  END IF;
  UPDATE workspace_discovery_revisions SET revision = revision + 1
    WHERE user_id = CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;
  IF NOT FOUND THEN RAISE EXCEPTION 'Missing discovery authority' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER workspace_discovery_membership AFTER INSERT OR UPDATE OR DELETE ON workspace_memberships
  FOR EACH ROW EXECUTE FUNCTION advance_workspace_discovery_revision();
CREATE TABLE workspace_creation_results (
  id uuid PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  scope_key varchar(44) NOT NULL,
  operation varchar(40) NOT NULL DEFAULT 'workspace:create:v1',
  request_key uuid NOT NULL,
  payload_digest varchar(64) NOT NULL CHECK (payload_digest ~ '^[0-9a-f]{64}$'),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  result jsonb,
  completed_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  retain_until timestamptz(3) NOT NULL,
  CONSTRAINT workspace_creation_scope CHECK (scope_key = 'account:' || actor_id::text AND operation = 'workspace:create:v1'),
  CONSTRAINT workspace_creation_result_bound CHECK (result IS NULL OR octet_length(result::text) <= 65536),
  CONSTRAINT workspace_creation_retention CHECK (retain_until >= completed_at + interval '24 hours'),
  UNIQUE(actor_id, scope_key, operation, request_key)
);
-- A unique ledger row reserves the key before effect creation. Its deferred
-- constraint forbids committing a reservation without the completed effect.
CREATE FUNCTION require_complete_workspace_creation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM workspace_creation_results WHERE id=NEW.id AND (workspace_id IS NULL OR result IS NULL)) THEN
    RAISE EXCEPTION 'Incomplete creation cannot commit' USING ERRCODE = '23514';
  END IF; RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER workspace_creation_complete AFTER INSERT ON workspace_creation_results
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION require_complete_workspace_creation();
CREATE FUNCTION protect_workspace_creation_result() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.workspace_id IS NULL AND OLD.result IS NULL AND NEW.workspace_id IS NOT NULL AND NEW.result IS NOT NULL
    AND (to_jsonb(NEW) - 'result' - 'workspace_id') = (to_jsonb(OLD) - 'result' - 'workspace_id') THEN RETURN NEW; END IF;
  IF TG_OP = 'DELETE' OR (to_jsonb(NEW) - 'result') IS DISTINCT FROM (to_jsonb(OLD) - 'result') OR
    (NEW.result IS DISTINCT FROM OLD.result AND (NEW.result IS NOT NULL OR statement_timestamp() < OLD.retain_until)) THEN
    RAISE EXCEPTION 'Creation result is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER workspace_creation_immutable BEFORE UPDATE OR DELETE ON workspace_creation_results
 FOR EACH ROW EXECUTE FUNCTION protect_workspace_creation_result();
COMMIT;
