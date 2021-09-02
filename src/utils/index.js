import crypto from 'crypto';
import path from 'path';
import fs from 'fs';


export function basicEmbed(message, options = {}) {
  return { description: message, ...options };
}

export function replyEmbed(message, ephemeral = true, options = {}) {
  return { embeds: [ basicEmbed(message, options) ], ephemeral };
}

export function swriteFileSync(fileName, data, options = { encoding: 'utf-8' }) {
  const folder = path.dirname(fileName);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  return fs.writeFileSync(fileName, data, options);
}

export function hash(data, method = 'sha1', encoding = 'hex') {
  const hash = crypto.createHash(method);

  hash.update(data);
  return hash.digest(encoding);
}

export function pathTo(...fileName) {
  return path.join(process.cwd(), 'files', ...fileName);
}

export function isDev() {
  // if defined
  return process.env.__DEV;
}
