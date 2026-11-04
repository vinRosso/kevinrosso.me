import type { APIRoute } from 'astro';
import { getListedPosts, postSlug } from '../lib/posts';
import { site } from '../data/site';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site: origin }) => {
  const base = String(origin).replace(/\/$/, '');
  const posts = await getListedPosts();

  const items = posts
    .map((p) => {
      const url = `${base}/blog/${postSlug(p)}/`;
      return `    <item>
      <title>${esc(p.data.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${p.data.date.toUTCString()}</pubDate>
      <description>${esc(p.data.description)}</description>
    </item>`;
    })
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(site.name)} - Blog</title>
    <link>${base}/blog/</link>
    <description>Rigs, tools and pipeline experiments.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`,
    { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } },
  );
};
