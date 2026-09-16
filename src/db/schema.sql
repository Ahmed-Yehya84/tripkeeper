CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY,
  telegram_id INTEGER UNIQUE,
  name TEXT,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'Africa/Cairo'
);
CREATE TABLE IF NOT EXISTS cars (
  id INTEGER PRIMARY KEY,
  driver_id INTEGER REFERENCES drivers(id),
  make TEXT, model TEXT, year INTEGER, plate TEXT,
  fuel_type_default TEXT DEFAULT '92',
  consumption_l_per_100 REAL DEFAULT 8.5,
  cost_per_km REAL DEFAULT 2.2
);
CREATE TABLE IF NOT EXISTS shifts (
  id INTEGER PRIMARY KEY,
  driver_id INTEGER, car_id INTEGER,
  started_at TEXT, ended_at TEXT,
  odo_start REAL, odo_end REAL,
  status TEXT DEFAULT 'active'
);
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY,
  driver_id INTEGER, car_id INTEGER, shift_id INTEGER,
  mode TEXT DEFAULT 'uber',
  pickup_lat REAL, pickup_lon REAL, drop_lat REAL, drop_lon REAL,
  zone_name TEXT,
  accepted_at TEXT, picked_up_at TEXT, dropped_at TEXT,
  km_trip REAL, km_dead REAL,
  amount REAL, currency TEXT DEFAULT 'EGP', payment TEXT,
  uber_cut REAL DEFAULT 0, net_earnings REAL, cost REAL, profit REAL,
  verdict TEXT, voice_note_file_id TEXT, raw_transcript TEXT
);
CREATE TABLE IF NOT EXISTS fuel_ups (
  id INTEGER PRIMARY KEY,
  car_id INTEGER, odometer REAL, liters REAL, cost REAL,
  fuel_type TEXT, station TEXT, done_at TEXT
);
CREATE TABLE IF NOT EXISTS maintenance_log (
  id INTEGER PRIMARY KEY,
  car_id INTEGER, odometer REAL, item TEXT, cost REAL,
  notes TEXT, receipt_photo_id TEXT, done_at TEXT
);
CREATE TABLE IF NOT EXISTS maintenance_schedule (
  id INTEGER PRIMARY KEY,
  car_id INTEGER, item TEXT,
  interval_km REAL, interval_months REAL,
  last_done_odo REAL, last_done_at TEXT
);
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY,
  driver_id INTEGER UNIQUE,
  fuel_price_92 REAL DEFAULT 17.25,
  fuel_price_95 REAL DEFAULT 19.0,
  uber_cut_pct REAL DEFAULT 25,
  report_hour INTEGER DEFAULT 3,
  language TEXT DEFAULT 'en'
);
