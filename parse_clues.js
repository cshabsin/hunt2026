const fs = require('fs');
const path = require('path');

const lines = fs.readFileSync('clues.txt', 'utf8').split('\n').filter(l => l.length > 0);

const pieces = [];
let idCounter = 0;

lines.forEach((line, lineIndex) => {
  // Split by brackets, capturing the brackets
  // Match [[ or ]] first (longest match)
  const tokens = line.split(/(\[\[|\]\]|\[|\])/);

  tokens.forEach(token => {
    if (!token) return;

    const piece = {
      id: idCounter++,
      originalLine: lineIndex,
      text: null,
      left: null,
      right: null
    };

    if (token === '[') {
      piece.right = '[';
    } else if (token === '[[') {
      piece.right = '[[';
    } else if (token === ']') {
      piece.left = ']';
    } else if (token === ']]') {
      piece.left = ']]';
    } else {
      // It's text
      piece.text = token;
    }

    pieces.push(piece);
  });
});

const outputPath = path.join('puzzle-ui', 'src', 'data.json');
fs.writeFileSync(outputPath, JSON.stringify(pieces, null, 2));

console.log(`Parsed ${pieces.length} pieces from ${lines.length} lines. Saved to ${outputPath}`);