import en from './en.js';
import ar from './ar.js';
import ru from './ru.js';
const packs = { en, ar, ru };
export const t = (lang, key, ...args) => {
  const pack = packs[lang] || packs.en;
  return typeof pack[key] === 'function' ? pack[key](...args) : pack[key];
};
