const fs = require('fs');
const path = require('path');

const clues = fs.readFileSync('clues.txt', 'utf8').split('\n').filter(line => line.length > 0);

const pieces = clues.map((line, index) => {
  let text = line;
  let left = null;
  let right = null;

  // Check for Left connectors (start of string)
  if (text.startsWith(']]')) {
    left = ']]';
    text = text.substring(2);
  } else if (text.startsWith(']')) {
    left = ']';
    text = text.substring(1);
  }

  // Check for Right connectors (end of string)
  if (text.endsWith('[[')) {
    right = '[[';
    text = text.substring(0, text.length - 2);
  } else if (text.endsWith('[')) {
    right = '[';
    text = text.substring(0, text.length - 1);
  }

  return {
    id: index,
    original: line,
    text: text,
    left: left,
    right: right
  };
});

const outputPath = path.join('puzzle-ui', 'src', 'data.json');
fs.writeFileSync(outputPath, JSON.stringify(pieces, null, 2));

console.log(`Parsed ${pieces.length} pieces. Saved to ${outputPath}`);
