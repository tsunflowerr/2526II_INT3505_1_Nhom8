-- +goose Up
-- +goose StatementBegin
DO $$ BEGIN
  CREATE TYPE user_provider AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ACTIVE', 'BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE users
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN password_hash DROP NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR,
  ADD COLUMN IF NOT EXISTS provider user_provider NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN IF NOT EXISTS provider_id VARCHAR,
  ADD COLUMN IF NOT EXISTS status user_status NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE users
  ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS unique_users_email;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_present
  ON users (lower(email))
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_provider_id_present
  ON users (provider, provider_id)
  WHERE provider_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS refresh_tokens;
DROP INDEX IF EXISTS ux_users_provider_id_present;
DROP INDEX IF EXISTS ux_users_email_present;
ALTER TABLE users
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS provider_id,
  DROP COLUMN IF EXISTS provider,
  DROP COLUMN IF EXISTS avatar_url;
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS user_provider;
-- +goose StatementEnd
