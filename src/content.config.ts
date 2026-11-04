import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Every post is a folder in src/content/blog/<slug>/ with an index.md
// and, optionally, a cover image next to it.
const blog = defineCollection({
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      tags: z.array(z.string()).default([]),
      // If set, the post card links straight to this page (Gumroad, LinkedIn...).
      externalUrl: z.string().url().optional(),
      externalLabel: z.string().optional(),
      // Show it in the "Featured work" row of the home page (max 3).
      featured: z.boolean().default(false),
      // Table of contents beside the post (needs at least two ## sections). false hides it.
      toc: z.boolean().default(true),
      // Reachable by its URL but left out of the lists (home, blog, tags).
      unlisted: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
