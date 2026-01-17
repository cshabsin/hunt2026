import React from 'react';
import { Game } from '@/lib/games';

interface GoBoardProps {
  game: Game;
}

const BOARD_SIZE = 19;

export default function GoBoard({ game }: GoBoardProps) {
  // Grid lines
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    lines.push(
      <line
        key={`h-${i}`}
        x1={0}
        y1={i}
        x2={BOARD_SIZE - 1}
        y2={i}
        stroke="black"
        strokeWidth="0.05"
      />
    );
    lines.push(
      <line
        key={`v-${i}`}
        x1={i}
        y1={0}
        x2={i}
        y2={BOARD_SIZE - 1}
        stroke="black"
        strokeWidth="0.05"
      />
    );
  }

  // Star points (Hoshi)
  // 0-indexed coordinates: 3, 9, 15
  const starPoints = [3, 9, 15];
  const hoshi: React.ReactNode[] = [];
  starPoints.forEach(x => {
    starPoints.forEach(y => {
      hoshi.push(
        <circle
          key={`star-${x}-${y}`}
          cx={x}
          cy={y}
          r={0.15}
          fill="black"
        />
      );
    });
  });

  return (
    <div className="w-full max-w-2xl aspect-square bg-[#eebb66] p-4 rounded-lg shadow-lg">
      <svg
        viewBox={`-0.5 -0.5 ${BOARD_SIZE} ${BOARD_SIZE}`}
        className="w-full h-full"
      >
        {/* Grid */}
        {lines}
        {/* Star points */}
        {hoshi}

        {/* Stones */}
        {game.black.map((stone, i) => (
          <circle
            key={`b-${i}`}
            cx={stone.x}
            cy={stone.y}
            r={0.45}
            fill="black"
            stroke="none"
          />
        ))}
        {game.white.map((stone, i) => (
          <circle
            key={`w-${i}`}
            cx={stone.x}
            cy={stone.y}
            r={0.45}
            fill="white"
            stroke="black"
            strokeWidth="0.03"
          />
        ))}
      </svg>
    </div>
  );
}