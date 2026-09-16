import { db } from '../db/db.js';

export function calcTripPnL({ driverId, mode, amount, payment, km }) {
  const car = db.prepare('SELECT * FROM cars WHERE driver_id = ? ORDER BY id LIMIT 1').get(driverId);
  const settings = db.prepare('SELECT * FROM settings WHERE driver_id = ?').get(driverId);
  if (!car || !settings || amount == null) return null;
  let gross = amount;
  let uberCut = 0;
  if (mode === 'uber' && payment === 'cash') {
    uberCut = amount * (settings.uber_cut_pct / 100);
    gross = amount - uberCut;
  }
  const cost = km * car.cost_per_km;
  return { gross, uberCut, cost, profit: gross - cost };
}

export function verdict(netPerKm, avgNetPerKm) {
  if (netPerKm >= avgNetPerKm * 1.1) return 'good';
  if (netPerKm >= avgNetPerKm * 0.7) return 'avg';
  return 'bad';
}
