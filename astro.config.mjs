// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkCallouts from './src/plugins/remark-callouts.mjs';
import remarkMermaid from './src/plugins/remark-mermaid.mjs';

export default defineConfig({
  site: 'https://kevinrosso.me',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    // The CSS is tiny: inlining it removes render-blocking requests.
    inlineStylesheets: 'always',
  },
  markdown: {
    // $...$ and $$...$$ for maths, > [!NOTE] banners, ```mermaid graphs.
    processor: unified({
      remarkPlugins: [remarkMath, remarkCallouts, remarkMermaid],
      rehypePlugins: [rehypeKatex],
    }),
    shikiConfig: { theme: 'github-dark' },
  },
});
