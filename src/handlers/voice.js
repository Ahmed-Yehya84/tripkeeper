import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { t } from '../i18n/index.js';
import { getOrCreateDriver } from '../db/db.js';
import { processInput } from './trips.js';

const run = promisify(execFile);
const PY = process.env.PYTHON || 'python3';
const TRANSCRIBER = path.join(process.cwd(), 'transcribe.py');

export function registerVoiceHandler(bot) {
  bot.on('voice', async (ctx) => {
    const d = getOrCreateDriver(ctx.from.id, ctx.from.first_name);
    const tmp = path.join(os.tmpdir(), `tk_${ctx.message.voice.file_id}.oga`);
    try {
      // 1. Download the voice note from Telegram
      const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
      const res = await fetch(link);
      await fs.promises.writeFile(tmp, Buffer.from(await res.arrayBuffer()));

      // 2. Transcribe with faster-whisper (tiny model — free, no API costs)
      const { stdout } = await run(PY, [TRANSCRIBER, tmp, d.language], { timeout: 60000 });
      const { text } = JSON.parse(stdout);
      if (!text) return ctx.reply(t(d.language, 'voiceEmpty'));

      // 3. Show the transcript, then feed it to the SAME brain as text messages
      await ctx.reply(`🎙️ "${text}"`);
      await processInput(ctx, d, text);
    } catch (e) {
      console.error('voice error', e);
      return ctx.reply(t(d.language, 'voiceError'));
    } finally {
      fs.promises.unlink(tmp).catch(() => {});
    }
  });
}
