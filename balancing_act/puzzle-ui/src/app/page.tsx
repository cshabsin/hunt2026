'use client';

import { useState, useMemo, useCallback } from 'react';
import initialData from '@/data.json';
import { parsePuzzle, ClueNode } from '@/utils/puzzleParser';

// Color spectrum for depth: Red, Orange, Yellow, Green, Blue, Indigo, Violet
const DEPTH_COLORS = [
  { bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-300' },
  { bg: 'bg-orange-50', border: 'border-orange-200', ring: 'ring-orange-300' },
  { bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-300' },
  { bg: 'bg-lime-50', border: 'border-lime-200', ring: 'ring-lime-300' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-300' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', ring: 'ring-cyan-300' },
  { bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-300' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', ring: 'ring-indigo-300' },
  { bg: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-300' },
  { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', ring: 'ring-fuchsia-300' },
];

function getAllIds(node: ClueNode): string[] {
    let ids = [node.id];
    for (const seg of node.segments) {
        if (typeof seg !== 'string') {
            ids = [...ids, ...getAllIds(seg)];
        }
    }
    return ids;
}

export default function Home() {
  const { root, initialAnswers } = useMemo(() => {
    return parsePuzzle(initialData);
  }, []);

  const allNodeIds = useMemo(() => getAllIds(root), [root]);

  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [id]: value
    }));
    // Auto-expand on type
    setExpandedNodes(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
    });
  };

  const toggleExpand = useCallback((id: string, expanded: boolean) => {
      setExpandedNodes(prev => {
          const next = new Set(prev);
          if (expanded) next.add(id);
          else next.delete(id);
          return next;
      });
  }, []);

  const expandAll = () => setExpandedNodes(new Set(allNodeIds));
  const collapseAll = () => setExpandedNodes(new Set());

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900 font-sans">
      <header className="mb-8 sticky top-0 bg-gray-50 z-20 py-4 border-b flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Balancing Act</h1>
            <p className="text-gray-600 text-sm">
            Solve inner clues to reveal outer clues.
            </p>
        </div>
        <div className="space-x-2">
            <button 
                onClick={expandAll}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
            >
                Expand All
            </button>
            <button 
                onClick={collapseAll}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium"
            >
                Collapse All
            </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Render children of root directly */}
        {root.segments.map((seg, i) => {
          if (typeof seg === 'string') {
             return <span key={i} className="text-lg">{seg}</span>;
          } else {
             return (
               <ClueNodeView 
                 key={seg.id} 
                 node={seg} 
                 answers={answers} 
                 onAnswerChange={handleAnswerChange}
                 depth={0} 
                 expandedNodes={expandedNodes}
                 onToggleExpand={toggleExpand}
               />
             );
          }
        })}
      </div>
    </main>
  );
}

function ClueNodeView({ node, answers, onAnswerChange, depth = 0, expandedNodes, onToggleExpand }: { 
  node: ClueNode, 
  answers: Record<string, string>, 
  onAnswerChange: (id: string, val: string) => void,
  depth: number,
  expandedNodes: Set<string>,
  onToggleExpand: (id: string, expanded: boolean) => void
}) {
  const answer = answers[node.id];
  const hasAnswer = !!answer && answer.trim().length > 0;
  const isExpanded = expandedNodes.has(node.id);
  
  // Get colors based on depth
  const colors = DEPTH_COLORS[depth % DEPTH_COLORS.length];

  // If solved and not expanded, show compact Answer-only view
  if (hasAnswer && !isExpanded) {
    return (
      <div 
        className={`
          inline-flex items-center px-1.5 py-0.5 mx-0.5 my-0.5
          border rounded shadow-sm transition-all cursor-pointer hover:brightness-95
          ${colors.bg} ${colors.border}
        `}
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand(node.id, true);
        }}
      >
        <span className="text-green-800 font-bold font-mono text-sm">{answer}</span>
      </div>
    );
  }

  return (
    <div 
      className={`
        inline-flex flex-wrap items-center gap-x-1 px-1.5 py-0.5 mx-0.5 my-0.5
        border rounded shadow-sm transition-all
        ${colors.bg} ${colors.border}
      `}
    >
      {/* Opening Bracket - Clicking this collapses it if solved */}
      <span 
        className={`text-gray-400 font-bold select-none text-xs ${hasAnswer ? 'cursor-pointer hover:text-gray-600' : ''}`}
        onClick={(e) => {
          if (hasAnswer) {
            e.stopPropagation();
            onToggleExpand(node.id, false);
          }
        }}
      >
        [
      </span>
      
      {/* Content: Text and Nested Clues */}
      {node.segments.map((seg, i) => {
        if (typeof seg === 'string') {
          const text = seg.trim();
          if (!text) return null;
          return (
            <span 
              key={i} 
              className={`font-serif text-sm whitespace-pre-wrap ${hasAnswer ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={(e) => {
                if (hasAnswer) {
                  e.stopPropagation();
                  onToggleExpand(node.id, false);
                }
              }}
            >
              {text}
            </span>
          );
        } else {
          return (
            <ClueNodeView 
              key={seg.id} 
              node={seg} 
              answers={answers} 
              onAnswerChange={onAnswerChange}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          );
        }
      })}
      
      {/* Colon Divider */}
      <span className="text-gray-300 font-bold select-none mx-0.5">:</span>

      {/* Inline Input */}
      <input 
        type="text" 
        value={answer || ''}
        onChange={(e) => {
          onAnswerChange(node.id, e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && hasAnswer) {
            onToggleExpand(node.id, false);
          }
        }}
        className={`
          w-20 bg-transparent border-b border-gray-300 outline-none text-sm font-mono text-center
          focus:border-blue-500 transition-colors
          ${hasAnswer ? 'text-green-700 font-bold border-green-300' : 'text-gray-600'}
        `}
        placeholder="..."
      />

      {/* Closing Bracket */}
      <span 
        className={`text-gray-400 font-bold select-none text-xs ${hasAnswer ? 'cursor-pointer hover:text-gray-600' : ''}`}
        onClick={(e) => {
          if (hasAnswer) {
            e.stopPropagation();
            onToggleExpand(node.id, false);
          }
        }}
      >
        ]
      </span>
    </div>
  );
}
