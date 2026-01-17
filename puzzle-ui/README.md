# Bracket City Puzzle Solver

This is a Next.js application designed to help solve the "Bracket City" puzzle.
It parses the clues and provides an interactive UI to match clue fragments.

## Setup

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- **Automatic Parsing**: Clues are parsed from `clues.txt` (via `src/data.json`).
- **Drag-and-Drop / Click-to-Match**: Click two compatible pieces to merge them.
- **Categorization**: Pieces are organized by their connectors (Starts, Ends, Middles, Solved).
- **Undo/Reset**: Mistakes can be undone.

## Re-parsing Clues

If `clues.txt` changes, run the parser script in the root directory:

```bash
node ../parse_clues.js
```
Then restart the dev server.