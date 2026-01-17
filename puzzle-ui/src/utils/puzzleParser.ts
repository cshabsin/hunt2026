// We'll define types in a shared place or here

export interface ClueNode {
  id: string;
  type: 'root' | 'single' | 'double';
  segments: (string | ClueNode)[];
  answer: string;
  isLeaf: boolean; // True if it has no children (only text)
}

export interface ParseResult {
  root: ClueNode;
  initialAnswers: Record<string, string>;
}

export function parsePuzzle(pieces: any[]): ParseResult {
  const root: ClueNode = {
    id: 'root',
    type: 'root',
    segments: [],
    answer: '',
    isLeaf: false
  };

  const initialAnswers: Record<string, string> = {};
  const stack: ClueNode[] = [root];

  pieces.forEach((piece, index) => {
    // 1. Handle Closing Brackets (Left side of piece)
    let popCount = 0;
    if (piece.left === ']') popCount = 1;
    if (piece.left === ']]') popCount = 2;

    let lastPoppedNode: ClueNode | null = null;
    for (let i = 0; i < popCount; i++) {
      if (stack.length > 1) { // Never pop root
        lastPoppedNode = stack.pop() || null;
      }
    }

    const current = stack[stack.length - 1];

    // Determine Push Count (Right side)
    let pushCount = 0;
    if (piece.right === '[') {
      pushCount = 1;
    } else if (piece.right === '[[') {
      pushCount = 2; 
    }

    // 2. Add Text Segment
    if (piece.text) {
      // Check for pre-populated answer pattern ": WORD"
      let textContent = piece.text;
      const match = textContent.match(/(:|:) ([A-Z]+)$/);
      // Regex check: Ends with ": WORD".
      
      if (match) {
        const answer = match[2];
        const fullMatch = match[0]; // e.g. ": ANSWER"
        
        // Determine target:
        // If the text is JUST the answer (e.g. " : ANSWER" or ": ANSWER")
        // AND we just popped a node (meaning this answer sits immediately after a closing bracket)
        // THEN it likely belongs to the node we just closed.
        const isJustAnswer = textContent.trim() === fullMatch.trim();
        
        if (isJustAnswer && lastPoppedNode) {
             initialAnswers[lastPoppedNode.id] = answer;
             textContent = ""; // Remove the text entirely as it was just the answer
        } else {
             // Otherwise it belongs to the current parent context
             initialAnswers[current.id] = answer;
             textContent = textContent.substring(0, match.index); 
        }
      }

      if (textContent) {
        current.segments.push(textContent);
      }
    }

    // 3. Handle Opening Brackets (Push Nodes)
    for (let i = 0; i < pushCount; i++) {
        // Always get the latest node from the stack to ensure nesting
        const activeNode = stack[stack.length - 1];

        const newNode: ClueNode = {
            id: `node-${piece.id}-${i}`,
            type: 'single', // Treat all as single layers of nesting
            segments: [],
            answer: '',
            isLeaf: true
        };
        
        // Add to the currently active node
        activeNode.segments.push(newNode);
        // Push the new node to the stack so the next one (if any) nests inside it
        stack.push(newNode);
    }
  });

  return { root, initialAnswers };
}