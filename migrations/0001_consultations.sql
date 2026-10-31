-- Cloudflare D1 schema for consultation requests (optional).
-- Apply with:
--   npx wrangler d1 execute webthangs_consultations --file migrations/0001_consultations.sql --remote
-- or paste into the D1 console in the Cloudflare dashboard.

CREATE TABLE IF NOT EXISTS consultation_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  size_tier TEXT NOT NULL DEFAULT '',
  goals TEXT NOT NULL DEFAULT '',
  top_findings TEXT NOT NULL DEFAULT '',
  consent INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_consultation_created_at ON consultation_requests (created_at);
