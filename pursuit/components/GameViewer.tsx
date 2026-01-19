'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Game, Stone } from '@/lib/games';
import GoBoard from './GoBoard';
import { ChevronLeft, ChevronRight, Play, Square, Lightbulb, Puzzle } from 'lucide-react';
import { nextGeneration } from '@/lib/gameOfLife';

interface GameViewerProps {
  games: Game[];
}

interface UserMove extends Stone {
  color: 'Black' | 'White';
}

type Mode = 'Brainstorm' | 'Solve';

export default function GameViewer({ games }: GameViewerProps) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('Brainstorm');
  const [golMode, setGolMode] = useState<'Black' | 'White' | null>(null);
  const [golCells, setGolCells] = useState<Stone[]>([]);
  const [userMoves, setUserMoves] = useState<UserMove[]>([]); // For Brainstorm mode
  const [solveMoves, setSolveMoves] = useState<Record<number, UserMove>>({}); // For Solve mode
  const [replayIndex, setReplayIndex] = useState(0); // Deprecated but kept for type safety if needed, can remove
  const [generation, setGeneration] = useState(0);
  const golCellsRef = React.useRef(golCells);

  useEffect(() => {
      golCellsRef.current = golCells;
  }, [golCells]);

  // Reset state when changing games
  const handleIndexChange = useCallback((newIndex: number) => {
      setIndex(newIndex);
      setGolMode(null);
      setUserMoves([]); // Reset brainstorm moves
      setGeneration(0);
      // Do NOT reset solveMoves here
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleIndexChange(index > 0 ? index - 1 : index);
      } else if (e.key === 'ArrowRight') {
        handleIndexChange(index < games.length - 1 ? index + 1 : index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [games.length, index, handleIndexChange]);

  useEffect(() => {
      if (!golMode) return;
      const interval = setInterval(() => {
          const prev = golCellsRef.current;
          const next = nextGeneration(prev);
          
          // Check for stability
          const prevSet = new Set(prev.map(s => `${s.x},${s.y}`));
          const nextSet = new Set(next.map(s => `${s.x},${s.y}`));
          
          if (prevSet.size === nextSet.size && [...prevSet].every(s => nextSet.has(s))) {
              return; // Stop updating if stable
          }
          
          setGolCells(next);
          setGeneration(g => g + 1);
      }, 200);
      return () => clearInterval(interval);
  }, [golMode]);

  const baseGame = games[index];

  const startGameOfLife = (color: 'Black' | 'White') => {
      if (golMode === color) {
          setGolMode(null);
          setUserMoves([]);
          setGeneration(0);
          return;
      }
      
      let initialCells: Stone[] = [];
      const baseCells = color === 'Black' ? baseGame.black : baseGame.white;
      initialCells = [...baseCells];

      // In both modes, include user moves that match the color
      if (mode === 'Solve') {
          const storedMove = solveMoves[index];
          if (storedMove && storedMove.color === color) {
              initialCells.push(storedMove);
          }
      } else {
          const relevantUserMoves = userMoves.filter(m => m.color === color);
          initialCells = [...initialCells, ...relevantUserMoves];
      }
      
      setGolCells(initialCells);
      setGolMode(color);
      setGeneration(0);
  };
  
  const handleBoardClick = (x: number, y: number) => {
      if (golMode) return;
      
      const isOccupiedByBase = 
          baseGame.black.some(s => s.x === x && s.y === y) ||
          baseGame.white.some(s => s.x === x && s.y === y);
      
      if (isOccupiedByBase) return;

      if (mode === 'Solve') {
          // In Solve mode, we only allow ONE user move (the guess)
          // If they click a new spot, we replace the existing move for this game index.
          const newMove: UserMove = { x, y, color: baseGame.toPlay };
          setSolveMoves(prev => ({
              ...prev,
              [index]: newMove
          }));
          return;
      }
      
      // Brainstorm Mode Logic
      
      // Check if clicking on the last user move (Undo)
      const lastMove = userMoves[userMoves.length - 1];
      if (lastMove && lastMove.x === x && lastMove.y === y) {
          setUserMoves(prev => prev.slice(0, -1));
          return;
      }

      // Check if occupied by any other user move
      const isOccupiedByUser = userMoves.some(s => s.x === x && s.y === y);
      if (isOccupiedByUser) return;
      
      // Add new move
      let nextColor: 'Black' | 'White';
      if (userMoves.length > 0) {
          nextColor = userMoves[userMoves.length - 1].color === 'Black' ? 'White' : 'Black';
      } else {
          nextColor = baseGame.toPlay;
      }

      setUserMoves(prev => [...prev, { x, y, color: nextColor }]);
  };

  if (games.length === 0) {
    return <div>No games found.</div>;
  }

  let displayGame: Game;
  
  if (golMode) {
      displayGame = {
          black: golMode === 'Black' ? golCells : [],
          white: golMode === 'White' ? golCells : [],
          toPlay: baseGame.toPlay
      };
  } else {
      let activeBlack = [...baseGame.black];
      let activeWhite = [...baseGame.white];
      let nextToPlay = baseGame.toPlay;

      if (mode === 'Solve') {
          // Solve mode: overlay stored move if exists
          const storedMove = solveMoves[index];
          if (storedMove) {
              if (storedMove.color === 'Black') activeBlack.push(storedMove);
              else activeWhite.push(storedMove);
          }
          // nextToPlay remains baseGame.toPlay as we are just "placing" the next move
      } else {
          // Brainstorm mode: overlay userMoves stack
          activeBlack = [...activeBlack, ...userMoves.filter(m => m.color === 'Black')];
          activeWhite = [...activeWhite, ...userMoves.filter(m => m.color === 'White')];
          
          if (userMoves.length > 0) {
              nextToPlay = userMoves[userMoves.length - 1].color === 'Black' ? 'White' : 'Black';
          }
      }

      displayGame = { black: activeBlack, white: activeWhite, toPlay: nextToPlay };
  }

  // Construct Readout Game State
  const readoutGame: Game = useMemo(() => {
      const black: Stone[] = [];
      const white: Stone[] = [];
      Object.values(solveMoves).forEach(move => {
          if (move.color === 'Black') black.push({ x: move.x, y: move.y });
          else white.push({ x: move.x, y: move.y });
      });
      return { black, white, toPlay: 'Black' }; // toPlay is irrelevant for readout
  }, [solveMoves]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
        <h1 className="text-3xl font-bold text-gray-800">Pursuit of Liberty</h1>

        {/* Mode Toggle */}
        <div className="flex bg-gray-200 p-1 rounded-lg">
            <button
                onClick={() => setMode('Brainstorm')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                    mode === 'Brainstorm' ? 'bg-white shadow text-black' : 'text-gray-600 hover:text-black'
                }`}
            >
                <Lightbulb size={18} />
                Brainstorm
            </button>
            <button
                onClick={() => {
                    setMode('Solve');
                    setGolMode(null); // Ensure GOL stops when entering solve
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
                    mode === 'Solve' ? 'bg-white shadow text-black' : 'text-gray-600 hover:text-black'
                }`}
            >
                <Puzzle size={18} />
                Solve
            </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Puzzle Board Section */}
            <div className="flex flex-col items-center gap-4">
                <h2 className="text-xl font-bold text-gray-700">Puzzle</h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => handleIndexChange(Math.max(0, index - 1))}
                        disabled={index === 0}
                        className="p-2 bg-gray-200 rounded-full disabled:opacity-50 hover:bg-gray-300 transition"
                    >
                        <ChevronLeft size={32} />
                    </button>
                    
                    <GoBoard game={displayGame} onIntersectionClick={handleBoardClick} />

                    <button
                        onClick={() => handleIndexChange(Math.min(games.length - 1, index + 1))}
                        disabled={index === games.length - 1}
                        className="p-2 bg-gray-200 rounded-full disabled:opacity-50 hover:bg-gray-300 transition"
                    >
                        <ChevronRight size={32} />
                    </button>
                </div>
                 <div className="text-xl font-medium text-gray-700">
                    Game {index + 1} of {games.length}
                </div>
                
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <div className={`w-4 h-4 rounded-full border border-black ${displayGame.toPlay === 'Black' ? 'bg-black' : 'bg-white'}`} />
                  {displayGame.toPlay} to play
                </div>
            </div>

            {/* Readout Board Section */}
            <div className="flex flex-col items-center gap-4">
                <h2 className="text-xl font-bold text-gray-700">Readout</h2>
                <div className="py-2">
                     <GoBoard game={readoutGame} />
                </div>
                 <div className="text-gray-500 italic mt-4">
                    Accumulated Moves
                </div>
            </div>
        </div>

        {mode === 'Brainstorm' && (
            <div className="flex gap-4">
                <button
                    onClick={() => startGameOfLife('Black')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                        golMode === 'Black' 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                >
                    {golMode === 'Black' ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    {golMode === 'Black' ? 'Stop GOL (Black)' : 'Play GOL Black'}
                </button>
                <button
                    onClick={() => startGameOfLife('White')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-gray-300 transition ${
                        golMode === 'White'
                        ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                        : 'bg-white text-gray-800 hover:bg-gray-50'
                    }`}
                >
                    {golMode === 'White' ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    {golMode === 'White' ? 'Stop GOL (White)' : 'Play GOL White'}
                </button>
            </div>
        )}
        
        {golMode && (
            <div className="text-lg font-semibold text-gray-700">
                Generation: {generation}
            </div>
        )}
        
        <p className="text-sm text-gray-500">
            Use Left/Right Arrow keys to navigate
        </p>
    </div>
  );
}
