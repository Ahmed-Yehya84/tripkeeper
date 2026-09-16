import { db, getOrCreateDriver, getActiveShift } from '../db/db.js';
import { t } from '../i18n/index.js';

// Odometer: accept typed number now; photo+vision later
export function registerOdometerHandlers(bot) {
  bot.on('text', (ctx) => {
    const d = getOrCreateDriver(ctx.from.id, ctx.from.first_name);
    const shift = getActiveShift.get(d.id);
    if (!/^\d{1,7}$/.test(ctx.message.text.trim())) return; // pure number = odometer
    const odo = parseFloat(ctx.message.text);
    if (shift && !shift.odo_start) {
      db.prepare('UPDATE shifts SET odo_start = ? WHERE id = ?').run(odo, shift.id);
      return ctx.reply(t(d.language, 'odoSaved', odo));
    }
    if (shift && shift.odo_start) {
      db.prepare('UPDATE shifts SET odo_end = ?, status = ? WHERE id = ?').run(odo, 'closed', shift.id);
      const km = odo - shift.odo_start;
      return ctx.reply(`🛑 Shift closed: ${km.toFixed(1)} km driven. Report tonight.`);
    }
    return ctx.reply(t(d.language, 'noShift'));
  });
}
