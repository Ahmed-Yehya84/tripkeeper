import { db, getOrCreateDriver, getActiveShift } from '../db/db.js';
import { t } from '../i18n/index.js';
import { calcTripPnL } from '../services/costs.js';

// Parses "43 pounds card" / "43 cash" / "خلصت 43 كارت" from transcript or text
export function parseTripEnd(text) {
  const t2 = text.toLowerCase();
  if (!/(trip ended|dropped off|خلصت|доехал|закончил)/.test(t2)) return null;
  const num = t2.match(/(\d+[.,]?\d*)/);
  let amount;
  if (num) amount = parseFloat(num[1].replace(',', '.'));
  else {
    // Arabic spoken numbers: واحد..تسعة, عشرين، خمسين، مية/مائة
    const units = {واحد:1,اتنين:2,إثنين:2,تلاتة:3,ثلاثة:3,اربعة:4,أربعة:4,خمسة:5,ستة:6,سبعة:7,تمنية:8,ثمانية:8,تسعة:9};
    const tens  = {عشرين:20,تلاتين:30,ثلاثين:30,اربعين:40,أربعين:40,خمسين:50,ستين:60,سبعين:70,ثمانين:80,تسعين:90};
    let val = 0, found = false;
    for (const [w,v] of Object.entries(units)) if (t2.includes(w)) { val += v; found = true; }
    for (const [w,v] of Object.entries(tens))  if (t2.includes(w)) { val += v; found = true; }
    if (/(مية|مائة|ميّة)/.test(t2)) { val = Math.max(val,1)*100; found = true; }
    if (!found) return null;
    amount = val;
  }
  const payment = /(card|كارت|картой|карта)/.test(t2) ? 'card' : 'cash';
  return { amount, payment };
}

export function registerTripHandlers(bot) {
  bot.on('text', (ctx) => {
    const d = getOrCreateDriver(ctx.from.id, ctx.from.first_name);
    // pure numbers are odometer input — leave them for the odometer handler
    if (/^\d{1,7}$/.test(ctx.message.text.trim())) return;
    return processInput(ctx, d, ctx.message.text);
  });
}

// ONE brain for both text and voice transcripts
export async function processInput(ctx, d, text) {
  const shift = getActiveShift.get(d.id);
  const parsed = parseTripEnd(text);
  if (parsed) return handleTripEnd(ctx, d, shift, parsed, text);
  if (/(accept|принял|принима|بدأ|بدا|ناول)/i.test(text)) return handleTripStart(ctx, d, shift);
  return ctx.reply(t(d.language, 'notUnderstood'));
}

export function handleTripStart(ctx, d, shift) {
  if (!shift) return ctx.reply(t(d.language, 'noShift'));
  db.prepare('INSERT INTO trips (driver_id, car_id, shift_id, mode, accepted_at) VALUES (?, ?, ?, ?, ?)')
    .run(d.id, shift.car_id, shift.id, shift.mode, new Date().toISOString());
  return ctx.reply(t(d.language, 'tripStarted'));
}

export function handleTripEnd(ctx, d, shift, parsed, transcript) {
  if (!shift) return ctx.reply(t(d.language, 'noShift'));
  const trip = db.prepare('SELECT * FROM trips WHERE shift_id = ? AND accepted_at IS NOT NULL AND dropped_at IS NULL ORDER BY id DESC LIMIT 1').get(shift.id);
  if (!trip) return ctx.reply(t(d.language, 'notUnderstood'));
  const now = new Date().toISOString();
  const pnl = calcTripPnL({ driverId: d.id, mode: trip.mode, amount: parsed.amount, payment: parsed.payment, km: 0 });
  db.prepare(`UPDATE trips SET dropped_at = ?, amount = ?, payment = ?, uber_cut = ?, net_earnings = ?, cost = ?, profit = ?, raw_transcript = ? WHERE id = ?`)
    .run(now, parsed.amount, parsed.payment, pnl?.uberCut ?? 0, pnl?.gross ?? 0, pnl?.cost ?? 0, pnl?.profit ?? 0, transcript, trip.id);
  return ctx.reply(t(d.language, 'tripEnded', parsed.amount, parsed.payment === 'card' ? '💳 card' : '💵 cash'));
}
