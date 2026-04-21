-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM (
  'USER',
  'ADMIN'
);

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  role          user_role    NOT NULL DEFAULT 'USER',
  email         VARCHAR      NOT NULL,
  password_hash VARCHAR      NOT NULL,
  full_name     VARCHAR      NOT NULL,
  phone         VARCHAR      NOT NULL,

  created_at    timestamptz  NOT NULL,
  updated_at    timestamptz  NOT NULL,
  deleted_at    timestamptz,

  CONSTRAINT unique_users_email UNIQUE (email),
  CONSTRAINT unique_users_phone UNIQUE (phone)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS users;
DROP TYPE  IF EXISTS user_role;
-- +goose StatementEnd
