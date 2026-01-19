import fs from 'fs';
import path from 'path';

export interface Stone {
  x: number;
  y: number;
}

export interface Game {
  black: Stone[];
  white: Stone[];
  toPlay: 'Black' | 'White';
}

function parseCoordinate(coord: string): Stone | null {
  if (!coord || coord === '___') return null;
  
  const letterPart = coord.charAt(0).toUpperCase();
  const numberPart = parseInt(coord.slice(1), 10);

  if (isNaN(numberPart)) return null;

  let x = letterPart.charCodeAt(0) - 'A'.charCodeAt(0);
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
        return { black: [], white: [], toPlay: 'Black' };
    }

    const line1 = lines[0]; // Black
    const line2 = lines[1]; // White

    const toPlay = line1.includes('___') ? 'Black' : 'White';

    const parseLine = (line: string) => {
        return line.split(/\s+/).map(parseCoordinate).filter((s): s is Stone => s !== null);
    };

    return {
        black: parseLine(line1),
        white: parseLine(line2),
        toPlay,
    };
  });

  return games;
}
