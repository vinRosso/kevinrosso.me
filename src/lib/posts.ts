import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

// Every post that has a page. Drafts only exist in `npm run dev`.
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// The posts shown in lists (home, blog, tag pages).
export async function getListedPosts(): Promise<Post[]> {
  return (await getPosts()).filter((p) => !p.data.unlisted);
}

// "kr-catenary/index" -> "kr-catenary"
export function postSlug(post: Post): string {
  return post.id.replace(/\/index$/, '');
}

// "Rigging tool" -> "rigging-tool"
export function tagSlug(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface TagInfo {
  slug: string;
  name: string;
  count: number;
}

// All tags of the listed posts, most used first.
export async function getTags(): Promise<TagInfo[]> {
  const map = new Map<string, TagInfo>();
  for (const post of await getListedPosts()) {
    for (const name of post.data.tags) {
      const slug = tagSlug(name);
      const known = map.get(slug);
      if (known) known.count += 1;
      else map.set(slug, { slug, name, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}
