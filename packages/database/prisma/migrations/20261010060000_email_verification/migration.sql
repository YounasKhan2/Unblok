ALTER TABLE password_credentials ADD CONSTRAINT password_credentials_identity_id_email_key UNIQUE(identity_id, email);
CREATE TABLE email_verification_challenges (
 id UUID PRIMARY KEY, identity_id UUID NOT NULL, email VARCHAR(320) NOT NULL,
 auth_epoch BIGINT NOT NULL CHECK(auth_epoch > 0), key_id VARCHAR(40) NOT NULL,
 token_digest VARCHAR(64) NOT NULL CHECK(token_digest ~ '^[0-9a-f]{64}$'),
 issued_at TIMESTAMPTZ(3) NOT NULL, expires_at TIMESTAMPTZ(3) NOT NULL,
 consumed_at TIMESTAMPTZ(3), canceled_at TIMESTAMPTZ(3), attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 10),
 FOREIGN KEY(identity_id,email) REFERENCES password_credentials(identity_id,email) ON UPDATE RESTRICT ON DELETE RESTRICT,
 CHECK(expires_at > issued_at AND expires_at <= issued_at + interval '15 minutes'),
 CHECK(consumed_at IS NULL OR (consumed_at >= issued_at AND consumed_at < expires_at AND canceled_at IS NULL)),
 CHECK(canceled_at IS NULL OR canceled_at >= issued_at)
);
CREATE INDEX email_verification_challenges_identity_id_expires_at_idx ON email_verification_challenges(identity_id,expires_at);
CREATE TABLE email_verification_outbox (
 challenge_id UUID PRIMARY KEY REFERENCES email_verification_challenges(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
 attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5), next_attempt_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 lease_id UUID, lease_until TIMESTAMPTZ(3), delivered_at TIMESTAMPTZ(3),
 CHECK((lease_id IS NULL) = (lease_until IS NULL))
);
CREATE FUNCTION protect_email_verification_challenge() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Retain verification challenge evidence'; END IF;
 IF ROW(NEW.id,NEW.identity_id,NEW.email,NEW.auth_epoch,NEW.key_id,NEW.token_digest,NEW.issued_at,NEW.expires_at)
    IS DISTINCT FROM ROW(OLD.id,OLD.identity_id,OLD.email,OLD.auth_epoch,OLD.key_id,OLD.token_digest,OLD.issued_at,OLD.expires_at)
    OR NEW.attempts < OLD.attempts
    OR (OLD.consumed_at IS NOT NULL AND NEW IS DISTINCT FROM OLD)
    OR (OLD.canceled_at IS NOT NULL AND NEW IS DISTINCT FROM OLD) THEN
   RAISE EXCEPTION 'Verification evidence cannot be rewritten';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER email_verification_challenge_guard BEFORE UPDATE OR DELETE ON email_verification_challenges
 FOR EACH ROW EXECUTE FUNCTION protect_email_verification_challenge();
