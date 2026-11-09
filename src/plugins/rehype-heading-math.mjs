// Headings with inline maths ($r$): Astro builds the table of contents from a heading's plain
// text, and after KaTeX that text holds every rendering of the formula ("Finding rrr"). This
// plugin runs before rehype-katex and, for each such heading:
//   - sets its id from the TeX source, so the anchor reads #23-finding-r instead of -rrr;
//   - stores a label with the maths rendered by KaTeX in frontmatter.headingLabels[id], which
//     the post page passes to TableOfContents (read via remarkPluginFrontmatter).
import katex from 'katex';
import GithubSlugger from 'github-slugger';

const isMath = (n) =>
  n.type === 'element' && n.tagName === 'code' && [n.properties?.className].flat().includes('math-inline');

const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function walk(node, acc) {
  for (const child of node.children ?? []) {
    if (child.type === 'text') {
      acc.text += child.value;
      acc.html += escape(child.value);
    } else if (isMath(child)) {
      const tex = (child.children ?? []).map((c) => c.value ?? '').join('');
      acc.text += tex;
      acc.html += katex.renderToString(tex, { throwOnError: false, output: 'html' });
      acc.math = true;
    } else {
      walk(child, acc);
    }
  }
}

export default function rehypeHeadingMath() {
  return (tree, file) => {
    const slugger = new GithubSlugger();
    const labels = {};
    const visit = (node) => {
      if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) {
        const acc = { text: '', html: '', math: false };
        walk(node, acc);
        if (acc.math && typeof node.properties?.id !== 'string') {
          const id = slugger.slug(acc.text);
          node.properties.id = id;
          labels[id] = acc.html;
        }
        return;
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);
    if (Object.keys(labels).length) {
      file.data.astro ??= {};
      file.data.astro.frontmatter ??= {};
      file.data.astro.frontmatter.headingLabels = labels;
    }
  };
}
