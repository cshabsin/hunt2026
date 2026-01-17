const fs = require('fs');

const lines = fs.readFileSync('clues.txt', 'utf8').split('\n').filter(l => l.length > 0);

let stack = [];
let structure = [];

lines.forEach((line, index) => {
  let text = line;
  let opens = 0;
  let closes = 0;

  // Determine open/close type
  let openType = null; // '[' or '[['
  let closeType = null; // ']' or ']]'

  if (text.startsWith(']]')) {
    closeType = ']]';
    text = text.substring(2);
  } else if (text.startsWith(']')) {
    closeType = ']';
    text = text.substring(1);
  }

  if (text.endsWith('[[')) {
    openType = '[[';
    text = text.substring(0, text.length - 2);
  } else if (text.endsWith('[')) {
    openType = '[';
    text = text.substring(0, text.length - 1);
  }

  console.log(`Line ${index}: ${closeType || '-'} ... ${openType || '-'}  | "${text}"`);

  if (closeType) {
    if (stack.length === 0) {
      console.error(`Error at line ${index}: Unexpected closing bracket ${closeType}`);
    } else {
      const lastOpen = stack.pop();
      // Check matching? '[' matches ']', '[[' matches ']]'
      // Simplified check for now
      console.log(`  Matched ${closeType} with ${lastOpen.type} from line ${lastOpen.index}`);
    }
  }

  if (openType) {
    stack.push({ index, type: openType });
  }
});

if (stack.length > 0) {
  console.log('Unclosed brackets remaining:', stack);
} else {
  console.log('All brackets balanced.');
}
