// Link previews: for every external link in a post, fetch the target page once (at build or dev
// time), read its title, description and image, and store them on the <a> as data-preview-*
// attributes. The post page shows them in a card when the link is hovered (see the script in
// src/pages/blog/[...slug].astro). Pages that can't be read (login walls, timeouts, no metadata)
// simply get no preview. Results are cached in .cache/link-previews.json.
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const CACHE_FILE = new URL('../../.cache/link-previews.json', import.meta.url);
const OK_TTL = 7 * 24 * 3600 * 1000; // re-check a good preview after a week
const FAIL_TTL = 24 * 3600 * 1000; // retry a failed one after a day
const UA = 'Mozilla/5.0 (compatible; kevinrosso.me link-preview)';
const OWN_HOSTS = new Set(['kevinrosso.me', 'www.kevinrosso.me']);

let cache; // url -> { at, data | null }
const inflight = new Map();

async function loadCache() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(CACHE_FILE, 'utf8'));
  } catch {
    cache = {};
  }
  return cache;
}

async function saveCache() {
  try {
    await mkdir(new URL('./', CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {
    // A cache that can't be written only costs a refetch next time.
  }
}

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });

function metaContent(html, keys) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    if (!key || !keys.includes(key)) continue;
    const value = /content\s*=\s*"([^"]*)"|content\s*=\s*'([^']*)'/i.exec(tag);
    const text = value?.[1] ?? value?.[2];
    if (text?.trim()) return decode(text).replace(/\s+/g, ' ').trim();
  }
  return undefined;
}

function parse(html, pageUrl) {
  const head = html.slice(0, html.search(/<\/head>/i) > 0 ? html.search(/<\/head>/i) : 200_000);
  const title =
    metaContent(head, ['og:title', 'twitter:title']) ??
    decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1] ?? '').replace(/\s+/g, ' ').trim();
  if (!title) return null;
  const description = metaContent(head, ['og:description', 'twitter:description', 'description']);
  const site = metaContent(head, ['og:site_name']) ?? new URL(pageUrl).hostname.replace(/^www\./, '');
  let image = metaContent(head, ['og:image', 'og:image:url', 'twitter:image']);
  if (image) {
    try {
      const abs = new URL(image, pageUrl);
      image = abs.protocol === 'https:' || abs.protocol === 'http:' ? abs.href : undefined;
    } catch {
      image = undefined;
    }
  }
  const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
  return { title: clip(title, 120), description: clip(description, 200), site, image };
}

async function fetchPreview(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok || !(res.headers.get('content-type') ?? '').includes('html')) return null;
  return parse((await res.text()).slice(0, 300_000), res.url || url);
}

async function preview(url) {
  const store = await loadCache();
  const hit = store[url];
  if (hit && Date.now() - hit.at < (hit.data ? OK_TTL : FAIL_TTL)) return hit.data;
  if (!inflight.has(url)) {
    inflight.set(
      url,
      fetchPreview(url)
        .catch(() => null)
        .then((data) => {
          store[url] = { at: Date.now(), data };
          return data;
        }),
    );
  }
  return inflight.get(url);
}

function isExternal(href) {
  if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return false;
  try {
    return !OWN_HOSTS.has(new URL(href).hostname);
  } catch {
    return false;
  }
}

function collect(node, out) {
  if (node.type === 'element' && node.tagName === 'a' && isExternal(node.properties?.href)) {
    const cls = [node.properties.className].flat().filter(Boolean);
    if (!cls.includes('btn')) out.push(node);
  }
  for (const child of node.children ?? []) collect(child, out);
}

export default function rehypeLinkPreviews() {
  return async (tree) => {
    const links = [];
    collect(tree, links);
    if (!links.length) return;
    await Promise.all(
      links.map(async (a) => {
        const data = await preview(a.properties.href);
        if (!data) return;
        a.properties.dataPreviewTitle = data.title;
        if (data.description) a.properties.dataPreviewDesc = data.description;
        if (data.image) a.properties.dataPreviewImage = data.image;
        a.properties.dataPreviewSite = data.site;
      }),
    );
    await saveCache();
  };
}
