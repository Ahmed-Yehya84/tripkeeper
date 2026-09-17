import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { registerShiftHandlers } from './handlers/shift.js';
import { registerTripHandlers } from './handlers/trips.js';
import { registerOdometerHandlers } from './handlers/odometer.js';
import { registerVoiceHandler } from './handlers/voice.js';

const bot = new Telegraf(process.env.BOT_TOKEN);
registerShiftHandlers(bot);
registerTripHandlers(bot);
registerOdometerHandlers(bot);
registerVoiceHandler(bot);

bot.catch((err) => console.error('Bot error:', err));
bot.launch();
console.log('🚗 TripKeeper running — long polling active');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
