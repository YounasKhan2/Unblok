-- Additive ownership contract. Existing and new password identities are unverified.
ALTER TABLE password_credentials ADD COLUMN email_verified_at TIMESTAMPTZ(3);
ALTER TABLE password_credentials ADD CONSTRAINT password_email_verification_order
  CHECK (email_verified_at IS NULL OR email_verified_at >= created_at);

-- Verification is bound to this immutable identity/email tuple. Changing an
-- address or linking accounts needs a separately reviewed future workflow.
CREATE FUNCTION protect_password_credential_binding() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.identity_id IS DISTINCT FROM OLD.identity_id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Password credential ownership binding is immutable';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER password_credential_binding_immutable BEFORE UPDATE ON password_credentials
  FOR EACH ROW EXECUTE FUNCTION protect_password_credential_binding();
