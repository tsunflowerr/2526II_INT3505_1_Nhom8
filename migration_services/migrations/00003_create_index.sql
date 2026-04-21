-- +goose Up
-- +goose StatementBegin

CREATE INDEX idx_sts_showtime_status_active
  ON show_time_seats(show_time_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_sts_expires_holding
  ON show_time_seats(expires_at)
  WHERE status = 'HOLDING';

CREATE INDEX idx_sts_booking
  ON show_time_seats(booking_id)
  WHERE booking_id IS NOT NULL;

CREATE INDEX idx_bookings_user
  ON bookings(user_id);

CREATE INDEX idx_bookings_user_status
  ON bookings(user_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_bookings_showtime_status
  ON bookings(show_time_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_bookings_expires_holding
  ON bookings(expires_at)
  WHERE status = 'HOLDING';


CREATE INDEX idx_sp_showtime
  ON seat_pricing(show_time_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_stcp_showtime_active
  ON show_time_class_pricing(show_time_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_show_times_event
  ON show_times(event_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_show_times_upcoming
  ON show_times(start_time)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_show_times_seat_map
  ON show_times(seat_map_id);

CREATE INDEX idx_seats_seat_map_class
  ON seats(seat_map_id, seat_class)
  WHERE deleted_at IS NULL;


CREATE INDEX idx_seat_maps_venue
  ON seat_maps(venue_id)
  WHERE deleted_at IS NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_seat_maps_venue;
DROP INDEX IF EXISTS idx_seats_seat_map_class;
DROP INDEX IF EXISTS idx_show_times_seat_map;
DROP INDEX IF EXISTS idx_show_times_upcoming;
DROP INDEX IF EXISTS idx_show_times_event;
DROP INDEX IF EXISTS idx_stcp_showtime_active;
DROP INDEX IF EXISTS idx_sp_showtime;
DROP INDEX IF EXISTS idx_bi_showtime_seat;
DROP INDEX IF EXISTS idx_bi_booking;
DROP INDEX IF EXISTS idx_bookings_expires_holding;
DROP INDEX IF EXISTS idx_bookings_showtime_status;
DROP INDEX IF EXISTS idx_bookings_user_status;
DROP INDEX IF EXISTS idx_bookings_user;
DROP INDEX IF EXISTS idx_sts_booking;
DROP INDEX IF EXISTS idx_sts_expires_holding;
DROP INDEX IF EXISTS idx_sts_showtime_status_active;
-- +goose StatementEnd
