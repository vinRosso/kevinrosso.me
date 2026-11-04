// Turns GitHub-style alerts into banners:
//
//   > [!NOTE]
//   > Text of the banner.
//
//   > [!WARNING] Custom title
//   > Text of the banner.
//
// Types: NOTE, TIP, IMPORTANT, WARNING, CAUTION.
const TYPES = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};

function walk(node, fn) {
  fn(node);
  if (node.children) node.children.forEach((child) => walk(child, fn));
}

export default function remarkCallouts() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== 'blockquote') return;
      const first = node.children?.[0];
      const text = first?.type === 'paragraph' ? first.children?.[0] : undefined;
      if (!text || text.type !== 'text') return;

      const match = text.value.match(/^\[!(note|tip|important|warning|caution)\][ \t]*([^\n]*)\n?/i);
      if (!match) return;

      const type = match[1].toLowerCase();
      const title = match[2].trim() || TYPES[type];
      text.value = text.value.slice(match[0].length);
      if (!text.value) first.children.shift();
      if (first.children.length === 0) node.children.shift();

      node.data = { hName: 'div', hProperties: { className: ['callout', `callout-${type}`] } };
      node.children.unshift({
        type: 'paragraph',
        data: { hName: 'p', hProperties: { className: ['callout-title'] } },
        children: [{ type: 'text', value: title }],
      });
    });
  };
}
