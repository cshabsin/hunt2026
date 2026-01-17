import fs from 'fs';
import path from 'path';

export interface Stone {
  x: number;
  y: number;
}

export interface Game {
  black: Stone[];
  white: Stone[];
}

function parseCoordinate(coord: string): Stone | null {
  if (!coord || coord === '___') return null;
  
  const letterPart = coord.charAt(0).toUpperCase();
  const numberPart = parseInt(coord.slice(1), 10);

  if (isNaN(numberPart)) return null;

  let x = letterPart.charCodeAt(0) - 'A'.charCodeAt(0);
  if (letterPart >= 'I') {
     // 'I' is skipped in standard Go notation usually, but let's check the input.
     // Input has 'J'. 
     // Usually A=1...H=8, J=9.
     // If input follows this, then we need to adjust.
     // If input strictly uses A-S (19 letters) including I, we don't adjust.
     // Given standard Go, I is skipped.
     if (letterPart > 'I') { // J is after I
         x--;
     } else if (letterPart === 'I') {
         // If we see 'I', maybe it's not skipped in this file?
         // But standard is skip. Let's assume skip unless we see 'I'.
         // If 'I' is present, we treat it as a column.
     }
  }
  // Wait, standard algorithm:
  // if (char >= 'J') x--; 
  // Because 'I' (index 8) is skipped. 'J' (index 9) becomes 8.
  // Input: 'J17'. J is 74. A is 65. 74-65 = 9.
  // If we skip I, J should be column 8 (0-indexed).
  // So yes, if char >= 'J', x--.
  
  // However, I should check if 'I' ever appears in the input.
  // The input has 'J17'. It doesn't seem to have 'I'.
  // I will assume standard Go notation (skip I).
  if (letterPart >= 'J') {
      x--;
  }

  // y: 19 is top (0). 1 is bottom (18).
  const y = 19 - numberPart;

  return { x, y };
}

export async function getGames(): Promise<Game[]> {
  const filePath = path.join(process.cwd(), 'input.txt');
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');

  // Split by empty lines (double newline)
  // Windows might have \r\n, so split by \n\n or \r\n\r\n
  // Regex is safer.
  const rawGames = fileContent.trim().split(/\n\s*\n/);

  const games: Game[] = rawGames.map((block) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    // Expect 2 lines.
    if (lines.length < 2) {
        // Fallback or error?
        // Let's try to parse what we have.
        return { black: [], white: [] };
    }

    const line1 = lines[0]; // Black
    const line2 = lines[1]; // White

    const parseLine = (line: string) => {
        return line.split(/\s+/).map(parseCoordinate).filter((s): s is Stone => s !== null);
    };

    return {
        black: parseLine(line1),
        white: parseLine(line2),
    };
  });

  return games;
}
