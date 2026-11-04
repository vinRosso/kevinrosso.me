// Encrypts the reel URL at build time, so the private Vimeo link never
// appears in the page source.
//
// - REEL_PASSWORD: a password visitors can type.
// - REEL_LINK_TOKENS: one private link per application, as a comma separated
//   list of "label=token" (see scripts/reel.mjs). The label is
//   encrypted too, so nobody can read where you applied from the page source.
// - REEL_LINK_TOKEN: an optional generic link (label "generic").

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const PASSWORD_ITERATIONS = 250_000;
// Link tokens are long random strings, a light key derivation is enough
// and keeps unlocking instant even with many tokens.
const TOKEN_ITERATIONS = 1_000;

export interface ReelSlot {
  /** Short hash of the token, only for link slots. Lets the browser pick the right slot. */
  id?: string;
  iterations: number;
  salt: string;
  iv: string;
  data: string;
}

export interface ReelPayload {
  slots: ReelSlot[];
  hasPassword: boolean;
}

export type ReelConfig =
  | { mode: 'public'; url: string }
  | { mode: 'protected'; payload: ReelPayload }
  | { mode: 'none' };

const toB64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

export const tokenId = (token: string) => createHash('sha256').update(token).digest('hex').slice(0, 16);

async function encrypt(secret: string, plaintext: string, iterations: number): Promise<Omit<ReelSlot, 'id'>> {
  const { subtle } = globalThis.crypto;
  const enc = new TextEncoder();
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const baseKey = await subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );
  const cipher = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  return { iterations, salt: toB64(salt), iv: toB64(iv), data: toB64(new Uint8Array(cipher)) };
}

function env(name: string): string {
  const value = (import.meta.env[name] ?? process.env[name] ?? '') as string;
  return value.trim();
}

// Accepts any Vimeo address (the page address vimeo.com/ID, vimeo.com/ID/HASH, or the player address)
// and returns the player address that can be embedded: vimeo.com pages refuse to be shown in a frame.
export function playerUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.hostname === 'player.vimeo.com') return u.toString();
    if (u.hostname === 'vimeo.com' || u.hostname.endsWith('.vimeo.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const id = parts.find((p) => /^\d+$/.test(p));
      if (id) {
        const next = parts[parts.indexOf(id) + 1];
        const hash = u.searchParams.get('h') ?? (next && /^[0-9a-f]{8,}$/i.test(next) ? next : '');
        return `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ''}`;
      }
    }
  } catch {
    /* not a URL: leave it as it is */
  }
  return raw;
}

export function parseTokens(raw: string): { label: string; token: string }[] {
  return raw
    .split(/[,\r\n]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry && !entry.startsWith('#'))
    .map((entry) => {
      const i = entry.indexOf('=');
      return i > 0
        ? { label: entry.slice(0, i).trim(), token: entry.slice(i + 1).trim() }
        : { label: 'link', token: entry };
    })
    .filter((t) => t.token.length >= 12);
}

export async function getReelConfig(): Promise<ReelConfig> {
  const url = playerUrl(env('REEL_URL'));
  if (!url) return { mode: 'none' };
  // REEL_PUBLIC=true shows the reel to everyone, without password.
  if (/^(1|true|yes)$/i.test(env('REEL_PUBLIC'))) return { mode: 'public', url };
  const payload = await buildReelPayload();
  return payload ? { mode: 'protected', payload } : { mode: 'none' };
}

export async function buildReelPayload(): Promise<ReelPayload | null> {
  const url = playerUrl(env('REEL_URL'));
  if (!url) return null;

  const slots: ReelSlot[] = [];
  const password = env('REEL_PASSWORD');
  if (password) {
    slots.push(await encrypt(password, JSON.stringify({ url, label: 'password' }), PASSWORD_ITERATIONS));
  }

  const links = parseTokens(env('REEL_LINK_TOKENS'));
  // Locally, also use the links created with "npm run reel -- link".
  if (existsSync('reel-tokens.txt')) {
    for (const t of parseTokens(readFileSync('reel-tokens.txt', 'utf8'))) {
      if (!links.some((l) => l.token === t.token)) links.push(t);
    }
  }
  const generic = env('REEL_LINK_TOKEN');
  if (generic) links.push({ label: 'generic', token: generic });

  for (const { label, token } of links) {
    const slot = await encrypt(token, JSON.stringify({ url, label }), TOKEN_ITERATIONS);
    slots.push({ id: tokenId(token), ...slot });
  }

  return slots.length ? { slots, hasPassword: Boolean(password) } : null;
}
