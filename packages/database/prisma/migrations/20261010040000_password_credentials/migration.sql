-- Additive; User.email remains contact metadata, existing identities untouched.
CREATE TABLE password_credentials (
  identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(256) NOT NULL,
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT password_email_canonical CHECK (email = lower(email) AND email = btrim(email) AND email ~ '^[!-~]+@[!-~]+$'),
  CONSTRAINT password_hash_profile CHECK (password_hash ~ '^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$')
);
