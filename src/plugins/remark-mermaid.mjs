// Leaves ```mermaid blocks as plain <pre class="mermaid"> so the post page can
// draw them in the browser (see the script in src/pages/blog/[...slug].astro).
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function walk(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (child.type === 'code' && child.lang === 'mermaid') {
      return { type: 'html', value: `<pre class="mermaid">${escape(child.value)}</pre>` };
    }
    walk(child);
    return child;
  });
}

export default function remarkMermaid() {
  return (tree) => walk(tree);
}
