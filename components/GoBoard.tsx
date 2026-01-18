import React from 'react';
import { Game } from '@/lib/games';

interface GoBoardProps {
  game: Game;
  onIntersectionClick?: (x: number, y: number) => void;
}

const BOARD_SIZE = 19;

export default function GoBoard({ game, onIntersectionClick }: GoBoardProps) {
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

  // Click targets
  const clickTargets: React.ReactNode[] = [];
  if (onIntersectionClick) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        clickTargets.push(
          <circle
            key={`click-${x}-${y}`}
            cx={x}
            cy={y}
            r={0.45}
            fill="transparent"
            onClick={() => onIntersectionClick(x, y)}
            className="cursor-pointer hover:fill-black/10"
          />
        );
      }
    }
  }

  // Labels
  const labels: React.ReactNode[] = [];
  const alphabet = "ABCDEFGHJKLMNOPQRST";
  for (let i = 0; i < BOARD_SIZE; i++) {
    // Column labels (A-T)
    const colLabel = alphabet[i];
    labels.push(
      <text key={`ct-${i}`} x={i} y={-0.8} fontSize="0.6" textAnchor="middle" fill="black" className="font-bold select-none">
        {colLabel}
      </text>
    );
    labels.push(
      <text key={`cb-${i}`} x={i} y={BOARD_SIZE - 1 + 1} fontSize="0.6" textAnchor="middle" fill="black" className="font-bold select-none">
        {colLabel}
      </text>
    );

    // Row labels (19-1)
    const rowLabel = BOARD_SIZE - i;
    labels.push(
      <text key={`rl-${i}`} x={-1} y={i} fontSize="0.6" textAnchor="middle" dominantBaseline="middle" fill="black" className="font-bold select-none">
        {rowLabel}
      </text>
    );
    labels.push(
      <text key={`rr-${i}`} x={BOARD_SIZE - 1 + 1} y={i} fontSize="0.6" textAnchor="middle" dominantBaseline="middle" fill="black" className="font-bold select-none">
        {rowLabel}
      </text>
    );
  }

  return (
    <div className="w-full max-w-2xl aspect-square bg-[#eebb66] p-4 rounded-lg shadow-lg">
      <svg
        viewBox="-1.5 -1.5 21 21"
        className="w-full h-full"
      >
        {/* Labels */}
        {labels}
        
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
        
        {/* Click Overlay */}
        {clickTargets}
      </svg>
    </div>
  );
}