'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { SkillTreeData, SkillNode } from '../types';
import { getPosition } from '../utils/geometry';

interface NodeWithPosition extends SkillNode {
  x: number;
  y: number;
}

export default function SkillTree() {
  const [data, setData] = useState<SkillTreeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data.json')
      .then((res) => res.json())
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load skill tree data', err);
        setLoading(false);
      });
  }, []);

  const { nodes, connections } = useMemo(() => {
    if (!data) return { nodes: [], connections: [] };

    const nodesMap = new Map<string, NodeWithPosition>();
    const calculatedNodes: NodeWithPosition[] = [];
    const calculatedConnections: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];

    const CANVAS_WIDTH = 22000;
    const CANVAS_HEIGHT = 18000;
    const OFFSET_X = CANVAS_WIDTH / 2;
    const OFFSET_Y = CANVAS_HEIGHT / 2;

    // 1. Calculate positions
    Object.entries(data.nodes).forEach(([id, node]) => {
        // Skip root or nodes without group
        const groupId = node.group;
        if (groupId === undefined || !data.groups[groupId]) return;

        const pos = getPosition(node, data.groups[groupId], data.constants);
        
        // Apply offset to center the tree in the positive coordinate space
        const x = pos.x + OFFSET_X;
        const y = pos.y + OFFSET_Y;

        const nodeWithPos = { ...node, x, y, id: parseInt(id) || 0 };
        nodesMap.set(id, nodeWithPos);
        calculatedNodes.push(nodeWithPos);
    });

    // 2. Calculate connections
    const seenConnections = new Set<string>();
    calculatedNodes.forEach(node => {
        if (node.out) {
            node.out.forEach(targetId => {
                const target = nodesMap.get(targetId);
                if (target) {
                    const id1 = Math.min(node.skill || node.id, target.skill || target.id);
                    const id2 = Math.max(node.skill || node.id, target.skill || target.id);
                    const connKey = `${id1}-${id2}`;
                    
                    if (!seenConnections.has(connKey)) {
                        seenConnections.add(connKey);
                        calculatedConnections.push({
                            x1: node.x,
                            y1: node.y,
                            x2: target.x,
                            y2: target.y,
                            key: connKey
                        });
                    }
                }
            });
        }
    });

    return { nodes: calculatedNodes, connections: calculatedConnections, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }, [data]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
      <div className="text-xl font-serif">Loading Skill Tree...</div>
    </div>
  );
  if (!data) return (
    <div className="flex items-center justify-center h-screen bg-black text-red-500">
      Error loading data. Make sure public/data.json exists.
    </div>
  );

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      <TransformWrapper
        initialScale={0.2}
        minScale={0.05}
        maxScale={2}
        centerOnInit={true}
        limitToBounds={false}
      >
        <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
            <div style={{ 
                width: nodes.length ? 22000 : '100%', 
                height: nodes.length ? 18000 : '100%', 
                position: 'relative',
                background: '#050505' // Very dark bg for contrast
            }}>
                <svg width="22000" height="18000" className="absolute top-0 left-0 pointer-events-none">
                    {connections.map(conn => (
                        <line 
                            key={conn.key}
                            x1={conn.x1} 
                            y1={conn.y1} 
                            x2={conn.x2} 
                            y2={conn.y2} 
                            stroke="#333" 
                            strokeWidth="4" 
                        />
                    ))}
                </svg>
                
                {nodes.map(node => (
                    <div
                        key={node.skill || node.id}
                        className={`absolute rounded-full border border-gray-600 flex items-center justify-center group
                            ${node.isKeystone ? 'w-16 h-16 bg-red-900 z-20 border-2 border-red-500' : node.isNotable ? 'w-10 h-10 bg-yellow-700 z-10 border-yellow-500' : 'w-4 h-4 bg-gray-800 z-0'}
                        `}
                        style={{
                            left: node.x,
                            top: node.y,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                         <div className="hidden group-hover:block absolute bottom-full mb-2 p-2 bg-gray-900 text-white text-xs rounded border border-gray-700 whitespace-nowrap z-50 pointer-events-none min-w-[200px]">
                            <div className="font-bold text-yellow-500 text-sm mb-1">{node.name}</div>
                            {node.stats?.map((s, i) => <div key={i} className="text-gray-300">{s}</div>)}
                            {node.isKeystone && <div className="text-red-400 mt-1 text-[10px] uppercase tracking-wider">Keystone</div>}
                            {node.isNotable && <div className="text-yellow-400 mt-1 text-[10px] uppercase tracking-wider">Notable</div>}
                         </div>
                    </div>
                ))}
            </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
