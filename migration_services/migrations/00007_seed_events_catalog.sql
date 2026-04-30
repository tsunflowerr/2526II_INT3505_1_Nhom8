-- +goose Up
-- +goose StatementBegin
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS category VARCHAR(60),
  ADD COLUMN IF NOT EXISTS venue TEXT,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS organizer TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS sale_opens_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status VARCHAR(30);

INSERT INTO users (id, role, email, password_hash, full_name, phone, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'USER', 'demo.user@ticketrush.local', 'dev-hash', 'Demo User', '0900000001', now(), now()),
  ('11111111-1111-1111-1111-111111111112', 'ADMIN', 'admin@ticketrush.local', '$argon2id$v=19$m=65536,t=3,p=4$YQL2E8SlFgsXqnOVotdhAA$tL61Gr71lEnpYu6e6kCZRuNfAZb2gySSmBmaxElxvto', 'TicketRush Admin', '0900000002', now(), now());

INSERT INTO venues (id, name, address, created_at, updated_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'TicketRush Arena East', '12 Nguyen Hue, District 1, Ho Chi Minh City', now(), now()),
  ('20000000-0000-0000-0000-000000000002', 'TicketRush Arena West', '88 Tran Hung Dao, District 5, Ho Chi Minh City', now(), now()),
  ('20000000-0000-0000-0000-000000000003', 'TicketRush Cinema Center', '25 Le Loi, District 1, Ho Chi Minh City', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO seat_maps (id, name, venue_id, created_at, updated_at)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'Arena East Main Bowl', '20000000-0000-0000-0000-000000000001', now(), now()),
  ('30000000-0000-0000-0000-000000000002', 'Arena West Grand Hall', '20000000-0000-0000-0000-000000000002', now(), now()),
  ('30000000-0000-0000-0000-000000000003', 'Cinema Center Screen 1', '20000000-0000-0000-0000-000000000003', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO seats (id, seat_map_id, row, number, seat_class, created_at, updated_at)
SELECT
  uuid_generate_v5('00000000-0000-0000-0000-000000000001', seat_map_id::text || '-' || row_code || '-' || seat_no::text),
  seat_map_id::uuid,
  row_code,
  seat_no,
  CASE
    WHEN row_code IN ('A', 'B') THEN 'DELUXE'::seat_class
    WHEN row_code IN ('C', 'D', 'E') THEN 'PREMIUM'::seat_class
    WHEN row_code IN ('F', 'G') THEN 'VIP'::seat_class
    ELSE 'STANDARD'::seat_class
  END,
  now(),
  now()
FROM (VALUES
  ('30000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000003')
) seat_maps(seat_map_id)
CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H')) rows(row_code)
CROSS JOIN generate_series(1, 12) seat_no
ON CONFLICT (seat_map_id, row, number) DO NOTHING;

INSERT INTO events (
  id, name, description, duration_minutes, event_type, category, venue, city, address, organizer,
  image_url, sale_opens_at, is_flash_sale, status, director, age_rating, release_date, language, created_at, updated_at
)
VALUES
  ('40000000-0000-0000-0000-000000000001', 'Neon Nights Live', 'EDM and visual art live show.', 180, 'EVENT', 'Music', 'TicketRush Arena East', 'Ho Chi Minh City', '12 Nguyen Hue, District 1', 'Rush Beats', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80', now() - interval '5 days', true, 'Flash Sale', NULL, NULL, NULL, NULL, now(), now()),
  ('40000000-0000-0000-0000-000000000002', 'City Derby Night', 'Top football derby with fan zone.', 140, 'EVENT', 'Sports', 'TicketRush Arena West', 'Ho Chi Minh City', '88 Tran Hung Dao, District 5', 'Saigon Sports Club', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80', now() - interval '7 days', false, 'Available', NULL, NULL, NULL, NULL, now(), now()),
  ('40000000-0000-0000-0000-000000000003', 'Standup Riot', 'Comedy showcase with 6 comics.', 120, 'EVENT', 'Comedy', 'TicketRush Arena West', 'Ho Chi Minh City', '88 Tran Hung Dao, District 5', 'Laugh Factory VN', 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1200&q=80', now() - interval '3 days', false, 'Available', NULL, NULL, NULL, NULL, now(), now()),
  ('40000000-0000-0000-0000-000000000004', 'Future Tech Expo', 'Interactive workshop and startup demos.', 300, 'EVENT', 'Workshop', 'TicketRush Arena East', 'Ho Chi Minh City', '12 Nguyen Hue, District 1', 'TechViet Community', 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80', now() - interval '6 days', false, 'Available', NULL, NULL, NULL, NULL, now(), now()),
  ('40000000-0000-0000-0000-000000000005', 'Midnight Symphony', 'Orchestra special with immersive lights.', 150, 'EVENT', 'Theater', 'TicketRush Arena East', 'Ho Chi Minh City', '12 Nguyen Hue, District 1', 'HCM Youth Orchestra', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80', now() - interval '8 days', false, 'Almost Sold Out', NULL, NULL, NULL, NULL, now(), now()),
  ('40000000-0000-0000-0000-000000000006', 'Summer Street Festival', 'Open-air urban festival and food lane.', 240, 'EVENT', 'Festival', 'TicketRush Arena West', 'Ho Chi Minh City', '88 Tran Hung Dao, District 5', 'Urban Live Team', 'https://images.unsplash.com/photo-1496024840928-4c417adf211d?auto=format&fit=crop&w=1200&q=80', now() - interval '2 days', true, 'Flash Sale', NULL, NULL, NULL, NULL, now(), now()),
  ('40000000-0000-0000-0000-000000000007', 'Starlight Heist', 'Sci-fi thriller in a neon city.', 128, 'MOVIE', 'Cinema', 'TicketRush Cinema Center', 'Ho Chi Minh City', '25 Le Loi, District 1', 'TicketRush Cinema', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80', now() - interval '10 days', false, 'Available', 'Ari Chen', 'T13', now() - interval '1 month', 'English', now(), now()),
  ('40000000-0000-0000-0000-000000000008', 'Echoes of Saigon', 'Drama romance filmed in old Saigon.', 115, 'MOVIE', 'Cinema', 'TicketRush Cinema Center', 'Ho Chi Minh City', '25 Le Loi, District 1', 'TicketRush Cinema', 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1200&q=80', now() - interval '9 days', false, 'Available', 'Minh Tran', 'K', now() - interval '2 months', 'Vietnamese', now(), now()),
  ('40000000-0000-0000-0000-000000000009', 'Quantum Drift', 'Action movie with multiverse chase.', 132, 'MOVIE', 'Cinema', 'TicketRush Cinema Center', 'Ho Chi Minh City', '25 Le Loi, District 1', 'TicketRush Cinema', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80', now() - interval '11 days', true, 'Flash Sale', 'J. Howard', 'T16', now() - interval '20 days', 'English', now(), now()),
  ('40000000-0000-0000-0000-000000000010', 'Lanterns and Thunder', 'Epic historical fantasy.', 142, 'MOVIE', 'Cinema', 'TicketRush Cinema Center', 'Ho Chi Minh City', '25 Le Loi, District 1', 'TicketRush Cinema', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80', now() - interval '12 days', false, 'Almost Sold Out', 'Le Bao', 'T13', now() - interval '15 days', 'Vietnamese', now(), now()),
  ('40000000-0000-0000-0000-000000000011', 'Hollow Orbit', 'Psychological space mystery.', 118, 'MOVIE', 'Cinema', 'TicketRush Cinema Center', 'Ho Chi Minh City', '25 Le Loi, District 1', 'TicketRush Cinema', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80', now() - interval '13 days', false, 'Available', 'Nina Cole', 'T13', now() - interval '10 days', 'English', now(), now()),
  ('40000000-0000-0000-0000-000000000012', 'Final Whistle', 'Sports biopic of a legendary coach.', 124, 'MOVIE', 'Cinema', 'TicketRush Cinema Center', 'Ho Chi Minh City', '25 Le Loi, District 1', 'TicketRush Cinema', 'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?auto=format&fit=crop&w=1200&q=80', now() - interval '14 days', false, 'Available', 'Khoa Nguyen', 'K', now() - interval '25 days', 'Vietnamese', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO show_times (id, event_id, seat_map_id, start_time, end_time, created_at, updated_at)
VALUES
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', now() + interval '1 day 19 hours', now() + interval '1 day 22 hours', now(), now()),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', now() + interval '2 day 18 hours', now() + interval '2 day 20 hours 30 minutes', now(), now()),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', now() + interval '2 day 21 hours', now() + interval '2 day 23 hours', now(), now()),
  ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', now() + interval '3 day 9 hours', now() + interval '3 day 14 hours', now(), now()),
  ('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', now() + interval '4 day 20 hours', now() + interval '4 day 22 hours 30 minutes', now(), now()),
  ('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', now() + interval '5 day 17 hours', now() + interval '5 day 21 hours', now(), now()),
  ('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003', now() + interval '1 day 15 hours', now() + interval '1 day 17 hours 30 minutes', now(), now()),
  ('50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000003', now() + interval '1 day 20 hours', now() + interval '1 day 22 hours', now(), now()),
  ('50000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000003', now() + interval '2 day 16 hours', now() + interval '2 day 18 hours 15 minutes', now(), now()),
  ('50000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000003', now() + interval '3 day 19 hours', now() + interval '3 day 21 hours 20 minutes', now(), now()),
  ('50000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000003', now() + interval '4 day 18 hours', now() + interval '4 day 20 hours', now(), now()),
  ('50000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000003', now() + interval '5 day 20 hours', now() + interval '5 day 22 hours', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO show_time_seats (id, show_time_id, seat_id, booking_id, status, expires_at, created_at, updated_at)
SELECT
  uuid_generate_v5('00000000-0000-0000-0000-000000000002', st.id::text || '-' || s.id::text),
  st.id,
  s.id,
  NULL,
  'AVAILABLE'::showtime_seat_status,
  NULL,
  now(),
  now()
FROM show_times st
INNER JOIN seats s ON s.seat_map_id = st.seat_map_id
WHERE st.id::text LIKE '50000000-0000-0000-0000-0000000000%'
ON CONFLICT (show_time_id, seat_id) DO NOTHING;

INSERT INTO seat_pricing (id, show_time_id, seat_id, price, created_at, updated_at)
SELECT
  uuid_generate_v5('00000000-0000-0000-0000-000000000003', st.id::text || '-' || s.id::text || '-price'),
  st.id,
  s.id,
  CASE s.seat_class
    WHEN 'DELUXE'::seat_class THEN 420000
    WHEN 'PREMIUM'::seat_class THEN 320000
    WHEN 'VIP'::seat_class THEN 250000
    ELSE 180000
  END,
  now(),
  now()
FROM show_times st
INNER JOIN seats s ON s.seat_map_id = st.seat_map_id
WHERE st.id::text LIKE '50000000-0000-0000-0000-0000000000%'
ON CONFLICT (show_time_id, seat_id) DO NOTHING;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM seat_pricing WHERE show_time_id::text LIKE '50000000-0000-0000-0000-0000000000%';
DELETE FROM show_time_seats WHERE show_time_id::text LIKE '50000000-0000-0000-0000-0000000000%';
DELETE FROM show_times WHERE id::text LIKE '50000000-0000-0000-0000-0000000000%';
DELETE FROM events WHERE id::text LIKE '40000000-0000-0000-0000-0000000000%';
DELETE FROM seats WHERE seat_map_id::text LIKE '30000000-0000-0000-0000-00000000000_';
DELETE FROM seat_maps WHERE id::text LIKE '30000000-0000-0000-0000-00000000000_';
DELETE FROM venues WHERE id::text LIKE '20000000-0000-0000-0000-00000000000_';
DELETE FROM users WHERE id = '11111111-1111-1111-1111-111111111111';
DELETE FROM users WHERE id = '11111111-1111-1111-1111-111111111112';

ALTER TABLE events
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS is_flash_sale,
  DROP COLUMN IF EXISTS sale_opens_at,
  DROP COLUMN IF EXISTS image_url,
  DROP COLUMN IF EXISTS organizer,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS venue,
  DROP COLUMN IF EXISTS category;
-- +goose StatementEnd
