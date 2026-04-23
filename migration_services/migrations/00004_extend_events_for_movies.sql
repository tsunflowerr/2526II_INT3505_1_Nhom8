-- +goose Up
-- +goose StatementBegin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'event_type'
  ) THEN
    CREATE TYPE event_type AS ENUM ('EVENT', 'MOVIE');
  END IF;
END
$$;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_type event_type NOT NULL DEFAULT 'EVENT',
  ADD COLUMN IF NOT EXISTS director TEXT,
  ADD COLUMN IF NOT EXISTS age_rating VARCHAR(20),
  ADD COLUMN IF NOT EXISTS release_date timestamptz,
  ADD COLUMN IF NOT EXISTS language VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_events_type_active
  ON events(event_type)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_name_active
  ON events(name)
  WHERE deleted_at IS NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_events_name_active;
DROP INDEX IF EXISTS idx_events_type_active;

ALTER TABLE events
  DROP COLUMN IF EXISTS language,
  DROP COLUMN IF EXISTS release_date,
  DROP COLUMN IF EXISTS age_rating,
  DROP COLUMN IF EXISTS director,
  DROP COLUMN IF EXISTS event_type;

DROP TYPE IF EXISTS event_type;
-- +goose StatementEnd
