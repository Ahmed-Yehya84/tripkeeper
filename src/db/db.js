// Using Node's built-in SQLite (node:sqlite) — zero native compilation needed.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(__dirname, '../../data'), { recursive: true });
export const db = new DatabaseSync(join(__dirname, '../../data/bot.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));

export const getDriver = db.prepare('SELECT * FROM drivers WHERE telegram_id = ?');
export const getOrCreateDriver = (telegramId, name) => {
  let d = getDriver.get(telegramId);
  if (!d) {
    db.prepare('INSERT INTO drivers (telegram_id, name) VALUES (?, ?)').run(telegramId, name);
    db.prepare('INSERT OR IGNORE INTO settings (driver_id) VALUES ((SELECT id FROM drivers WHERE telegram_id=?))').run(telegramId);
    d = getDriver.get(telegramId);
  }
  return d;
};
export const getActiveShift = db.prepare(
  "SELECT * FROM shifts WHERE driver_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1");
export const activeCar = db.prepare('SELECT * FROM cars WHERE driver_id = ? ORDER BY id LIMIT 1');
