ALTER TABLE users ADD COLUMN auth_epoch BIGINT NOT NULL DEFAULT 1,
  ADD COLUMN auth_disabled BOOLEAN NOT NULL DEFAULT false,
  ADD CONSTRAINT users_auth_epoch_positive CHECK (auth_epoch > 0);
CREATE UNIQUE INDEX identities_id_user_id_key ON identities(id, user_id);
CREATE TABLE auth_session_families (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  identity_id UUID NOT NULL,
  auth_epoch BIGINT NOT NULL CHECK (auth_epoch > 0),
  generation BIGINT NOT NULL DEFAULT 1 CHECK (generation > 0),
  sid_digest VARCHAR(64) NOT NULL CHECK (sid_digest ~ '^[0-9a-f]{64}$'),
  revoked_at TIMESTAMPTZ(3),
  issued_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  absolute_expires_at TIMESTAMPTZ(3) NOT NULL,
  idle_expires_at TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT auth_session_deadlines CHECK (issued_at < absolute_expires_at AND issued_at < idle_expires_at AND idle_expires_at <= absolute_expires_at),
  CONSTRAINT auth_session_identity_fk FOREIGN KEY (identity_id, user_id) REFERENCES identities(id, user_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE INDEX auth_session_families_user_id_revoked_at_idx ON auth_session_families(user_id, revoked_at);
-- Defense in depth for privileged callers. Runtime code must still use the
-- database-owned lock order; administrators with DDL can bypass these triggers.
CREATE FUNCTION protect_auth_epoch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.auth_epoch < OLD.auth_epoch THEN RAISE EXCEPTION 'Authentication epoch cannot decrease'; END IF;
  -- Disabling an account invalidates old authority permanently, even if an
  -- administrator later re-enables it without explicitly rotating the epoch.
  IF NEW.auth_disabled AND NOT OLD.auth_disabled AND NEW.auth_epoch = OLD.auth_epoch THEN
    NEW.auth_epoch := OLD.auth_epoch + 1;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER users_auth_epoch_monotonic BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION protect_auth_epoch();
CREATE FUNCTION protect_auth_family() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Authentication fences must be retained'; END IF;
  IF NEW.id <> OLD.id OR NEW.user_id <> OLD.user_id OR NEW.identity_id <> OLD.identity_id
    OR NEW.auth_epoch <> OLD.auth_epoch OR NEW.issued_at <> OLD.issued_at
    OR NEW.absolute_expires_at <> OLD.absolute_expires_at OR NEW.generation < OLD.generation
    -- A revoked row is frozen; an identical UPDATE permits idempotent logout.
    OR (OLD.revoked_at IS NOT NULL AND NEW IS DISTINCT FROM OLD)
    -- Rotation is one atomic generation+digest transition, never either alone.
    OR ((NEW.generation IS DISTINCT FROM OLD.generation) <> (NEW.sid_digest IS DISTINCT FROM OLD.sid_digest))
    OR (NEW.generation <> OLD.generation AND NEW.generation - OLD.generation <> 1)
    -- First revocation changes only revoked_at, not generation/digest/idle time.
    OR (NEW.revoked_at IS DISTINCT FROM OLD.revoked_at AND (
      NEW.generation IS DISTINCT FROM OLD.generation OR NEW.sid_digest IS DISTINCT FROM OLD.sid_digest
      OR NEW.idle_expires_at IS DISTINCT FROM OLD.idle_expires_at))
  THEN RAISE EXCEPTION 'Invalid authentication fence transition'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER auth_family_monotonic BEFORE UPDATE OR DELETE ON auth_session_families FOR EACH ROW EXECUTE FUNCTION protect_auth_family();
