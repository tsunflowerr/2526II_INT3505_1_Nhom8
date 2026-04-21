-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE seat_class AS ENUM (
  'STANDARD',
  'VIP',
  'PREMIUM',
  'DELUXE'
);

CREATE TYPE booking_status AS ENUM (
  'HOLDING',
  'PAID',
  'CANCELED',
  'EXPIRED'
);

CREATE TYPE showtime_seat_status AS ENUM (
  'HOLDING',
  'AVAILABLE',
  'SOLD'
);

CREATE TABLE events (
  id               uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),

  name             TEXT        NOT NULL,
  description      TEXT,
  duration_minutes INT         NOT NULL CHECK (duration_minutes > 0),

  created_at       timestamptz NOT NULL,
  updated_at       timestamptz NOT NULL,
  deleted_at       timestamptz
);

CREATE TABLE venues (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),

  name       TEXT        NOT NULL,
  address    TEXT        NOT NULL,

  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  deleted_at timestamptz
);

CREATE TABLE seat_maps (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),

  name       TEXT        NOT NULL,
  venue_id   uuid        NOT NULL,

  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  deleted_at timestamptz,

  CONSTRAINT fk_seat_maps_venue
    FOREIGN KEY (venue_id) REFERENCES venues(id)
);

CREATE TABLE seats (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),

  seat_map_id uuid        NOT NULL,
  row         TEXT        NOT NULL,
  number      INT         NOT NULL CHECK (number > 0),
  seat_class  seat_class  NOT NULL,

  created_at  timestamptz NOT NULL,
  updated_at  timestamptz NOT NULL,
  deleted_at  timestamptz,

  CONSTRAINT fk_seats_seat_map
    FOREIGN KEY (seat_map_id) REFERENCES seat_maps(id) ON DELETE CASCADE,

  CONSTRAINT unique_seat
    UNIQUE (seat_map_id, row, number)
);


CREATE TABLE show_times (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),

  event_id    uuid        NOT NULL,
  seat_map_id uuid        NOT NULL,

  start_time  timestamptz NOT NULL,
  end_time    timestamptz NOT NULL,

  created_at  timestamptz NOT NULL,
  updated_at  timestamptz NOT NULL,
  deleted_at  timestamptz,

  CONSTRAINT fk_show_times_event
    FOREIGN KEY (event_id)    REFERENCES events(id),
  CONSTRAINT fk_show_times_seat_map
    FOREIGN KEY (seat_map_id) REFERENCES seat_maps(id),

  CONSTRAINT chk_show_times_time_order
    CHECK (end_time > start_time)
);


CREATE TABLE bookings (
  id           uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id      uuid           NOT NULL,
  show_time_id uuid           NOT NULL,

  status       booking_status NOT NULL DEFAULT 'HOLDING',
  expires_at   timestamptz,

  created_at   timestamptz    NOT NULL,
  updated_at   timestamptz    NOT NULL,
  deleted_at   timestamptz,

  CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id)      REFERENCES users(id),
  CONSTRAINT fk_bookings_show_time
    FOREIGN KEY (show_time_id) REFERENCES show_times(id),

  CONSTRAINT chk_bookings_holding_expires
    CHECK (status != 'HOLDING' OR expires_at IS NOT NULL)
);


CREATE TABLE show_time_seats (
  id           uuid                 PRIMARY KEY DEFAULT uuid_generate_v4(),

  show_time_id uuid                 NOT NULL,
  seat_id      uuid                 NOT NULL,
  booking_id   uuid,

  status       showtime_seat_status NOT NULL,
  expires_at   timestamptz,

  created_at   timestamptz          NOT NULL,
  updated_at   timestamptz          NOT NULL,
  deleted_at   timestamptz,

  CONSTRAINT fk_sts_showtime
    FOREIGN KEY (show_time_id) REFERENCES show_times(id),
  CONSTRAINT fk_sts_seat
    FOREIGN KEY (seat_id)      REFERENCES seats(id) ON DELETE CASCADE,
  CONSTRAINT fk_sts_booking
    FOREIGN KEY (booking_id)   REFERENCES bookings(id),

  CONSTRAINT unique_showtime_seat
    UNIQUE (show_time_id, seat_id),

  CONSTRAINT chk_sts_holding_expires
    CHECK (status != 'HOLDING' OR expires_at IS NOT NULL)
);


CREATE TABLE show_time_class_pricing (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),

  show_time_id uuid        NOT NULL,
  seat_class   seat_class  NOT NULL,
  price        numeric(10,2) NOT NULL,

  created_at   timestamptz NOT NULL,
  updated_at   timestamptz NOT NULL,
  deleted_at   timestamptz,

  CONSTRAINT fk_stcp_showtime
    FOREIGN KEY (show_time_id) REFERENCES show_times(id),

  CONSTRAINT unique_showtime_class_price
    UNIQUE (show_time_id, seat_class),

  CONSTRAINT chk_stcp_price_positive
    CHECK (price > 0)
);

CREATE TABLE seat_pricing (
  id           uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),

  show_time_id uuid          NOT NULL,
  seat_id      uuid          NOT NULL,
  price        numeric(10,2) NOT NULL,

  created_at   timestamptz   NOT NULL,
  updated_at   timestamptz   NOT NULL,
  deleted_at   timestamptz,

  CONSTRAINT fk_sp_showtime
    FOREIGN KEY (show_time_id) REFERENCES show_times(id),
  CONSTRAINT fk_sp_seat
    FOREIGN KEY (seat_id)      REFERENCES seats(id),

  CONSTRAINT unique_showtime_seat_price
    UNIQUE (show_time_id, seat_id),

  CONSTRAINT chk_sp_price_positive
    CHECK (price > 0)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS seat_pricing;
DROP TABLE IF EXISTS show_time_class_pricing;
DROP TABLE IF EXISTS show_time_seats;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS show_times;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS seat_maps;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS events;

DROP TYPE IF EXISTS showtime_seat_status;
DROP TYPE IF EXISTS booking_status;
DROP TYPE IF EXISTS seat_class;
-- +goose StatementEnd
