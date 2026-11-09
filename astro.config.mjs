// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkCallouts from './src/plugins/remark-callouts.mjs';
import remarkMermaid from './src/plugins/remark-mermaid.mjs';
import rehypeLinkPreviews from './src/plugins/rehype-link-previews.mjs';
import rehypeHeadingMath from './src/plugins/rehype-heading-math.mjs';
import { bundledThemes } from 'shiki/themes';
import mel from './src/plugins/mel.tmLanguage.mjs';

// github-dark plus a soft tone for MEL $variables (the stock theme leaves them plain white).
const githubDark = (await bundledThemes['github-dark']()).default;
const theme = {
  ...githubDark,
  name: 'github-dark-mel',
  tokenColors: [
    ...(githubDark.tokenColors ?? []),
    { scope: ['variable.other.mel'], settings: { foreground: '#C9B5A0' } },
  ],
};

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
      // Links get data-preview-* attributes (title, description, image) fetched from the target page.
      // rehypeHeadingMath must run before KaTeX: it reads the TeX source of maths in headings.
      rehypePlugins: [rehypeHeadingMath, rehypeKatex, rehypeLinkPreviews],
    }),
    // Shiki has no Maya MEL grammar: ```mel uses our own (src/plugins/mel.tmLanguage.mjs).
    shikiConfig: { theme, langs: [mel] },
  },
});
