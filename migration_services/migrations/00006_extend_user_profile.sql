-- +goose Up
-- +goose StatementBegin
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
  ADD COLUMN IF NOT EXISTS age INT,
  ADD COLUMN IF NOT EXISTS address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(32),
  ADD COLUMN IF NOT EXISTS bio VARCHAR(500);

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_age_check;

ALTER TABLE users
  ADD CONSTRAINT users_age_check CHECK (age IS NULL OR (age >= 1 AND age <= 120));
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_age_check;

ALTER TABLE users
  DROP COLUMN IF EXISTS bio,
  DROP COLUMN IF EXISTS phone_number,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS age,
  DROP COLUMN IF EXISTS gender;
-- +goose StatementEnd
