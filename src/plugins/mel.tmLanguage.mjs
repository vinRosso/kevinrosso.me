// Maya MEL grammar for Shiki (code fences tagged ```mel). Shiki ships no MEL language, so
// without this the blocks render as plain text. Covers what posts actually use: comments,
// strings, backtick command substitution, $variables, proc definitions, types, control
// keywords, numbers, function calls and -flags.
export default {
  name: 'mel',
  scopeName: 'source.mel',
  aliases: ['maya-mel'],
  patterns: [
    { include: '#comments' },
    { include: '#strings' },
    { include: '#backtick' },
    { include: '#proc' },
    { include: '#keywords' },
    { include: '#variables' },
    { include: '#numbers' },
    { include: '#calls' },
    { include: '#flags' },
    { include: '#operators' },
  ],
  repository: {
    comments: {
      patterns: [
        { name: 'comment.line.double-slash.mel', match: '//.*$' },
        { name: 'comment.block.mel', begin: '/\\*', end: '\\*/' },
      ],
    },
    strings: {
      name: 'string.quoted.double.mel',
      begin: '"',
      end: '"',
      patterns: [{ name: 'constant.character.escape.mel', match: '\\\\.' }],
    },
    backtick: {
      name: 'meta.embedded.command.mel',
      begin: '`',
      end: '`',
      beginCaptures: { 0: { name: 'punctuation.section.embedded.mel' } },
      endCaptures: { 0: { name: 'punctuation.section.embedded.mel' } },
      patterns: [{ include: '$self' }],
    },
    proc: {
      match:
        '\\b(?:(global)\\s+)?(proc)\\s+(?:(int|float|string|vector|matrix)(\\[\\])?\\s+)?([A-Za-z_]\\w*)',
      captures: {
        1: { name: 'storage.modifier.mel' },
        2: { name: 'keyword.other.proc.mel' },
        3: { name: 'storage.type.mel' },
        5: { name: 'entity.name.function.mel' },
      },
    },
    keywords: {
      patterns: [
        {
          name: 'keyword.control.mel',
          match: '\\b(if|else|for|in|while|do|switch|case|default|break|continue|return)\\b',
        },
        { name: 'storage.type.mel', match: '\\b(int|float|string|vector|matrix)\\b' },
        { name: 'storage.modifier.mel', match: '\\bglobal\\b' },
        { name: 'constant.language.mel', match: '\\b(true|false|on|off|yes|no)\\b' },
      ],
    },
    variables: { name: 'variable.other.mel', match: '\\$[A-Za-z_]\\w*' },
    numbers: {
      name: 'constant.numeric.mel',
      match: '(?<![\\w$])(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?\\b',
    },
    calls: {
      match: '\\b([A-Za-z_]\\w*)(?=\\s*\\()',
      captures: { 1: { name: 'entity.name.function.mel' } },
    },
    flags: { name: 'constant.other.flag.mel', match: '(?<![\\w$)\\]])-[A-Za-z]\\w*' },
    operators: { name: 'keyword.operator.mel', match: '[-+*/%=<>!&|^]+' },
  },
};
