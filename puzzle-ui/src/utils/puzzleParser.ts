// We'll define types in a shared place or here

export interface ClueNode {
  id: string;
  type: 'root' | 'single' | 'double';
  segments: (string | ClueNode)[];
  answer: string;
  isLeaf: boolean; // True if it has no children (only text)
}

export function parsePuzzle(pieces: any[]): ClueNode {
  const root: ClueNode = {
    id: 'root',
    type: 'root',
    segments: [],
    answer: '',
    isLeaf: false
  };

  const stack: ClueNode[] = [root];

  pieces.forEach((piece, index) => {
    // 1. Handle Closing Brackets (Left side of piece)
    let popCount = 0;
    if (piece.left === ']') popCount = 1;
    if (piece.left === ']]') popCount = 2;

    for (let i = 0; i < popCount; i++) {
      if (stack.length > 1) { // Never pop root
        stack.pop();
      }
    }

    const current = stack[stack.length - 1];

    // Determine Push Count (Right side)
    let pushCount = 0;
    let type: 'single' | 'double' = 'single';
    
    if (piece.right === '[') {
      pushCount = 1;
      type = 'single';
    } else if (piece.right === '[[') {
      pushCount = 2; 
      type = 'double';
    }

    // 2. Add Text Segment
    if (piece.text) {
      current.segments.push(piece.text);
    }

    // 3. Handle Opening Brackets (Push Nodes)
    for (let i = 0; i < pushCount; i++) {
        const newNode: ClueNode = {
            id: `node-${piece.id}-${i}`,
            type: (pushCount === 2 && i === 0) ? 'double' : 'single',
            segments: [],
            answer: '',
            isLeaf: true
        };
        
        // Add to current
        current.segments.push(newNode);
        // Push to stack
        stack.push(newNode);
    }
  });

  return root;
}