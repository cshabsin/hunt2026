'use client';

import React, { useState, useEffect } from 'react';
import { Game } from '@/lib/games';
import GoBoard from './GoBoard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GameViewerProps {
  games: Game[];
}

export default function GameViewer({ games }: GameViewerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight') {
        setIndex((prev) => (prev < games.length - 1 ? prev + 1 : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [games.length]);

  if (games.length === 0) {
    return <div>No games found.</div>;
  }

  const currentGame = games[index];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
        <h1 className="text-3xl font-bold text-gray-800">Go Game Viewer</h1>
        
        <div className="flex items-center gap-4">
            <button
                onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
                disabled={index === 0}
                className="p-2 bg-gray-200 rounded-full disabled:opacity-50 hover:bg-gray-300 transition"
            >
                <ChevronLeft size={32} />
            </button>
            
            <GoBoard game={currentGame} />

            <button
                onClick={() => setIndex((prev) => Math.min(games.length - 1, prev + 1))}
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
          <div className={`w-4 h-4 rounded-full border border-black ${currentGame.toPlay === 'Black' ? 'bg-black' : 'bg-white'}`} />
          {currentGame.toPlay} to play
        </div>
        
        <p className="text-sm text-gray-500">
            Use Left/Right Arrow keys to navigate
        </p>
    </div>
  );
}
