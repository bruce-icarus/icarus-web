CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed text NOT NULL,
  source_id text NOT NULL,
  title text,
  body text,
  lat float NOT NULL,
  lng float NOT NULL,
  severity text,
  category text,
  source_url text,
  metadata jsonb DEFAULT '{}',
  event_time timestamptz,
  ingested_at timestamptz DEFAULT now(),
  UNIQUE(feed, source_id)
);

CREATE INDEX idx_events_feed_time ON events (feed, event_time);
CREATE INDEX idx_events_ingested ON events (ingested_at);
CREATE INDEX idx_events_geo ON events (lat, lng);

CREATE TABLE feed_state (
  feed text PRIMARY KEY,
  last_polled_at timestamptz,
  poll_interval_s int NOT NULL,
  last_error text,
  status text DEFAULT 'ok'
);

INSERT INTO feed_state (feed, poll_interval_s) VALUES
  ('usgs', 300),
  ('gdelt', 900),
  ('firms', 900);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON events FOR SELECT USING (true);

ALTER TABLE feed_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role all" ON feed_state USING (true) WITH CHECK (true);
