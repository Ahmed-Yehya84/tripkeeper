import { db, getOrCreateDriver, getActiveShift } from '../db/db.js';
import { t } from '../i18n/index.js';
import { calcTripPnL } from '../services/costs.js';

// Parses "43 pounds card" / "43 cash" / "خلصت 43 كارت" from transcript or text
export function parseTripEnd(text) {
  const t2 = text.toLowerCase();
  if (!/(trip ended|dropped off|خلصت|доехал|закончил)/.test(t2)) return null;
  const num = t2.match(/(\d+[.,]?\d*)/);
  if (!num) return null;
  const amount = parseFloat(num[1].replace(',', '.'));
  const payment = /(card|كارت|картой|карта)/.test(t2) ? 'card' : 'cash';
  return { amount, payment };
}

export function registerTripHandlers(bot) {
  bot.on('text', (ctx) => {
    const d = getOrCreateDriver(ctx.from.id, ctx.from.first_name);
    return processInput(ctx, d, ctx.message.text);
  });
}

// ONE brain for both text and voice transcripts
export async function processInput(ctx, d, text) {
  const shift = getActiveShift.get(d.id);
  const parsed = parseTripEnd(text);
  if (parsed) return handleTripEnd(ctx, d, shift, parsed, text);
  if (/^(accepted|بدأت|принял)/i.test(text)) return handleTripStart(ctx, d, shift);
  return ctx.reply(t(d.language, 'notUnderstood'));
}

export function handleTripStart(ctx, d, shift) {
  if (!shift) return ctx.reply(t(d.language, 'noShift'));
  db.prepare('INSERT INTO trips (driver_id, car_id, shift_id, mode, accepted_at, active) VALUES (?, ?, ?, ?, ?, 1)')
    .run(d.id, shift.car_id, shift.id, shift.mode, new Date().toISOString());
  return ctx.reply(t(d.language, 'tripStarted'));
}

export function handleTripEnd(ctx, d, shift, parsed, transcript) {
  if (!shift) return ctx.reply(t(d.language, 'noShift'));
  const trip = db.prepare('SELECT * FROM trips WHERE shift_id = ? AND active = 1 ORDER BY id DESC LIMIT 1').get(shift.id);
  if (!trip) return ctx.reply(t(d.language, 'notUnderstood'));
  const now = new Date().toISOString();
  const pnl = calcTripPnL({ driverId: d.id, mode: trip.mode, amount: parsed.amount, payment: parsed.payment, km: 0 });
  db.prepare(`UPDATE trips SET dropped_at = ?, amount = ?, payment = ?, uber_cut = ?, net_earnings = ?, cost = ?, profit = ?, raw_transcript = ?, active = 0 WHERE id = ?`)
    .run(now, parsed.amount, parsed.payment, pnl?.uberCut ?? 0, pnl?.gross ?? 0, pnl?.cost ?? 0, pnl?.profit ?? 0, transcript, trip.id);
  return ctx.reply(t(d.language, 'tripEnded', parsed.amount, parsed.payment === 'card' ? '💳 card' : '💵 cash'));
}
