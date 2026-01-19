'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Game, Stone } from '@/lib/games';
import GoBoard from './GoBoard';
import { ChevronLeft, ChevronRight, Play, Square } from 'lucide-react';
import { nextGeneration } from '@/lib/gameOfLife';

interface GameViewerProps {
  games: Game[];
}

interface UserMove extends Stone {
  color: 'Black' | 'White';
}

export default function GameViewer({ games }: GameViewerProps) {
  const [index, setIndex] = useState(0);
  const [golMode, setGolMode] = useState<'Black' | 'White' | null>(null);
  const [golCells, setGolCells] = useState<Stone[]>([]);
  const [userMoves, setUserMoves] = useState<UserMove[]>([]);
  const [generation, setGeneration] = useState(0);
  const golCellsRef = React.useRef(golCells);

  useEffect(() => {
      golCellsRef.current = golCells;
  }, [golCells]);

  // Reset GOL when changing games
  const handleIndexChange = useCallback((newIndex: number) => {
      setIndex(newIndex);
      setGolMode(null);
      setUserMoves([]);
      setGeneration(0);
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

  const startGameOfLife = (color: 'Black' | 'White') => {
      if (golMode === color) {
          setGolMode(null);
          // If we stop, we might want to keep the nextMove? Or reset?
          // Resetting nextMove is safest as the board state is reset.
          setUserMoves([]);
          setGeneration(0);
          return;
      }
      
      const baseCells = color === 'Black' ? games[index].black : games[index].white;
      let initialCells = [...baseCells];
      
      // Include user moves that match the color being played
      const relevantUserMoves = userMoves.filter(m => m.color === color);
      initialCells = [...initialCells, ...relevantUserMoves];
      
      setGolCells(initialCells);
      setGolMode(color);
      setGeneration(0);
  };
  
  const handleBoardClick = (x: number, y: number) => {
      if (golMode) return;
      
      const isOccupiedByBase = 
          games[index].black.some(s => s.x === x && s.y === y) ||
          games[index].white.some(s => s.x === x && s.y === y);
      
      if (isOccupiedByBase) return;
      
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
          nextColor = games[index].toPlay;
      }

      setUserMoves(prev => [...prev, { x, y, color: nextColor }]);
  };

  if (games.length === 0) {
    return <div>No games found.</div>;
  }

  const baseGame = games[index];
  
  let displayGame: Game;
  
  if (golMode) {
      displayGame = {
          black: golMode === 'Black' ? golCells : [],
          white: golMode === 'White' ? golCells : [],
          toPlay: baseGame.toPlay
      };
  } else {
      const black = [...baseGame.black, ...userMoves.filter(m => m.color === 'Black')];
      const white = [...baseGame.white, ...userMoves.filter(m => m.color === 'White')];
      
      let nextToPlay = baseGame.toPlay;
      if (userMoves.length > 0) {
          nextToPlay = userMoves[userMoves.length - 1].color === 'Black' ? 'White' : 'Black';
      }

      displayGame = {
          black,
          white,
          toPlay: nextToPlay
      };
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
        <h1 className="text-3xl font-bold text-gray-800">Go Game Viewer</h1>
        
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
