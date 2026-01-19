import { Stone } from './games';

const BOARD_SIZE = 19;

export function nextGeneration(currentCells: Stone[]): Stone[] {
  // Use a map for quick lookups: "x,y" -> true
  const cellMap = new Set<string>();
  currentCells.forEach(s => cellMap.add(`${s.x},${s.y}`));

  // Helper to count neighbors
  const getNeighbors = (x: number, y: number) => {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
          if (cellMap.has(`${nx},${ny}`)) {
            count++;
          }
        }
      }
    }
    return count;
  };

  // Candidates for evaluation: all current cells and their neighbors
  const candidates = new Set<string>();
  currentCells.forEach(s => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
         const nx = s.x + dx;
         const ny = s.y + dy;
         if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
             candidates.add(`${nx},${ny}`);
         }
      }
    }
  });

  const nextGen: Stone[] = [];

  candidates.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      const neighbors = getNeighbors(x, y);
      const isAlive = cellMap.has(key);

      if (isAlive) {
          if (neighbors === 2 || neighbors === 3) {
              nextGen.push({ x, y });
          }
      } else {
          if (neighbors === 3) {
              nextGen.push({ x, y });
          }
      }
  });

  return nextGen;
}
