import { Markup } from 'telegraf';
import { db, getOrCreateDriver, getActiveShift, activeCar } from '../db/db.js';
import { t } from '../i18n/index.js';

export function registerShiftHandlers(bot) {
  const modeKeyboard = Markup.keyboard([
    ['🚗 Uber Shift', '👤 Private Client', '🏠 Family Mode'],
    ['🛑 End Shift'],
  ]).resize();

  bot.start((ctx) => {
    const d = getOrCreateDriver(ctx.from.id, ctx.from.first_name);
    return ctx.reply(t(d.language, 'welcome'), modeKeyboard);
  });

  bot.hears('🚗 Uber Shift', async (ctx) => {
    const d = getOrCreateDriver(ctx.from.id, ctx.from.first_name);
    if (getActiveShift.get(d.id)) return ctx.reply(t(d.language, 'alreadyShift'));
    const car = activeCar.get(d.id);
    if (!car) {
      db.prepare('INSERT INTO cars (driver_id, make, model, year) VALUES (?, ?, ?, ?)')
        .run(d.id, 'Nissan', 'Qashqai', 2017);
    }
    db.prepare('INSERT INTO shifts (driver_id, car_id, started_at, status) VALUES (?, ?, ?, ?)')
      .run(d.id, car ? car.id : null, new Date().toISOString(), 'active');
    return ctx.reply(t(d.language, 'askOdo'));
  });

  bot.hears('🏠 Family Mode', async (ctx) => {
    const d = getOrCreateDriver(ctx.from.id, ctx.from.first_name);
    return ctx.reply('🏠 ' + t(d.language, 'askOdo'));
  });

  bot.hears('🛑 End Shift', async (ctx) => {
    const d = getOrCreateDriver(ctx.from.id, ctx.from.first_name);
    const shift = getActiveShift.get(d.id);
    if (!shift) return ctx.reply(t(d.language, 'noShift'));
    return ctx.reply('📸 Send end-of-shift odometer photo (or type it).');
  });


  // /cancel — close any active shift/trip cleanly (escape hatch)
  bot.command('cancel', (ctx) => {
    const d = getOrCreateDriver(ctx.from.id, ctx.from.first_name);
    db.prepare('UPDATE trips SET active = 0 WHERE driver_id = ? AND active = 1').run(d.id);
    const r = db.prepare('UPDATE shifts SET status = \'cancelled\', ended_at = ? WHERE driver_id = ? AND status = \'active\'').run(new Date().toISOString(), d.id);
    return ctx.reply(r.changes ? '🧹 Shift cancelled. Nothing was lost — start fresh whenever you like.' : 'Nothing to cancel — you\'re clear.');
  });

  bot.command('start', (ctx) => ctx.reply(t(getOrCreateDriver(ctx.from.id, ctx.from.first_name).language, 'welcome'), modeKeyboard));

  bot.command('lang', (ctx) => {
    const d = getOrCreateDriver(ctx.from.id, ctx.from.first_name);
    return ctx.reply('Choose language', Markup.inlineKeyboard([
      [Markup.button.callback('English', 'lang:en')],
      [Markup.button.callback('العربية', 'lang:ar')],
      [Markup.button.callback('Русский', 'lang:ru')],
    ]));
  });

  bot.action(/lang:(.+)/, (ctx) => {
    const d = getOrCreateDriver(ctx.from.id, ctx.from.first_name);
    db.prepare('UPDATE drivers SET language = ? WHERE id = ?').run(ctx.match[1], d.id);
    return ctx.answerCbQuery().then(() => ctx.reply('✅ ' + t(ctx.match[1], 'welcome'), modeKeyboard));
  });

  return modeKeyboard;
}
