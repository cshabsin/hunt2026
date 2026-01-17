'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Game, Stone } from '@/lib/games';
import GoBoard from './GoBoard';
import { ChevronLeft, ChevronRight, Play, Square } from 'lucide-react';
import { nextGeneration } from '@/lib/gameOfLife';

interface GameViewerProps {
  games: Game[];
}

export default function GameViewer({ games }: GameViewerProps) {
  const [index, setIndex] = useState(0);
  const [golMode, setGolMode] = useState<'Black' | 'White' | null>(null);
  const [golCells, setGolCells] = useState<Stone[]>([]);
  const [nextMove, setNextMove] = useState<Stone | null>(null);
  const [generation, setGeneration] = useState(0);

  // Reset GOL when changing games
  const handleIndexChange = useCallback((newIndex: number) => {
      setIndex(newIndex);
      setGolMode(null);
      setNextMove(null);
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
          setGolCells(prev => {
              const next = nextGeneration(prev);
              
              // Check for stability
              const prevSet = new Set(prev.map(s => `${s.x},${s.y}`));
              const nextSet = new Set(next.map(s => `${s.x},${s.y}`));
              
              if (prevSet.size === nextSet.size && [...prevSet].every(s => nextSet.has(s))) {
                  return prev; // Stop updating if stable
              }
              
              setGeneration(g => g + 1);
              return next;
          });
      }, 200);
      return () => clearInterval(interval);
  }, [golMode]);

  const startGameOfLife = (color: 'Black' | 'White') => {
      if (golMode === color) {
          setGolMode(null);
          // If we stop, we might want to keep the nextMove? Or reset?
          // Resetting nextMove is safest as the board state is reset.
          setNextMove(null);
          setGeneration(0);
          return;
      }
      
      const baseCells = color === 'Black' ? games[index].black : games[index].white;
      let initialCells = [...baseCells];
      
      // Include the next move if it matches the color being played
      if (nextMove && games[index].toPlay === color) {
          initialCells.push(nextMove);
      }
      
      setGolCells(initialCells);
      setGolMode(color);
      setGeneration(0);
  };
  
  const handleBoardClick = (x: number, y: number) => {
      if (golMode) return;
      
      const isOccupied = 
          games[index].black.some(s => s.x === x && s.y === y) ||
          games[index].white.some(s => s.x === x && s.y === y);
      
      if (isOccupied) return;
      
      // If clicking the same spot, remove it? Optional. Let's just move it.
      if (nextMove && nextMove.x === x && nextMove.y === y) {
          setNextMove(null);
      } else {
          setNextMove({ x, y });
      }
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
      // Add nextMove to the appropriate list for display
      const black = [...baseGame.black];
      const white = [...baseGame.white];
      
      if (nextMove) {
          if (baseGame.toPlay === 'Black') black.push(nextMove);
          else white.push(nextMove);
      }
      
      displayGame = {
          black,
          white,
          toPlay: baseGame.toPlay
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
          <div className={`w-4 h-4 rounded-full border border-black ${baseGame.toPlay === 'Black' ? 'bg-black' : 'bg-white'}`} />
          {baseGame.toPlay} to play
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
