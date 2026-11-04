import type { APIRoute } from 'astro';
import { getListedPosts, postSlug } from '../lib/posts';

export const GET: APIRoute = async ({ site }) => {
  const base = String(site).replace(/\/$/, '');
  const posts = await getListedPosts();

  const urls: { path: string; date?: Date }[] = [
    { path: '/' },
    { path: '/blog/', date: posts[0]?.data.date },
    ...posts.map((p) => ({ path: `/blog/${postSlug(p)}/`, date: p.data.date })),
  ];

  const body = urls
    .map(
      (u) =>
        `  <url><loc>${base}${u.path}</loc>${u.date ? `<lastmod>${u.date.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`,
    )
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
