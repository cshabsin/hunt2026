# Go Game Viewer with Game of Life Simulation

This is a Next.js application that renders Go games from a text file and allows playing Conway's Game of Life using the stones as initial cell populations.

## Features

- **Game Parsing**: Reads `input.txt` from the root directory.
- **Go Board UI**: 19x19 grid with standard Go coordinates (A-T skipping I, 1-19) and Hoshi (star points).
- **Navigation**: Arrow keys or on-screen buttons to switch between games.
- **Interactive Placement**: Click to place stones alternating between Black and White. Click the most recent stone to undo.
- **Game of Life (GOL)**: 
  - Treat all stones of a specific color as GOL cells.
  - Simulation runs on the 19x19 grid.
  - Generation counter tracks progress.
  - Auto-stops when stability is reached.

## Design Notes for AI Development

### File Structure
- `lib/games.ts`: Contains the parser for `input.txt`. The parser handles standard Go coordinate strings (e.g., `C19`) and skips the letter "I" to align with standard Go notation.
- `lib/gameOfLife.ts`: Logic for computing the next generation of GOL cells on a bounded 19x19 grid.
- `components/GoBoard.tsx`: SVG-based rendering of the board, stones, and coordinate labels.
- `components/GameViewer.tsx`: Main client component managing the state of navigation, user-placed moves, and GOL simulation.

### State Management
- **User Moves**: `userMoves` is an array of `{x, y, color}` objects allowing multiple additions and sequential undo.
- **GOL Simulation**: Uses a `useRef` to track current cells inside `setInterval` to avoid React Strict Mode double-invocations causing double-increments of the generation counter.
- **Stability Check**: Every tick compares the set of cell coordinates between the current and next generation to determine if the board has stabilized.

### Coordinate Mapping
- Internally uses 0-indexed coordinates (0-18).
- X-axis: 0 maps to 'A', 8 to 'J' (skipping 'I').
- Y-axis: 0 is the top of the board (row 19), 18 is the bottom (row 1).

### Planned/Future Improvements
- Support for persistent GOL settings (e.g., wrap-around vs. bounded).
- Ability to save modified board states back to a file.
- Multi-color GOL where different colors interact.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.