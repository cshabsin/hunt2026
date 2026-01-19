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

    // 1. Calculate positions
    Object.entries(data.nodes).forEach(([id, node]) => {
        // Skip root or nodes without group
        const groupId = node.group;
        if (groupId === undefined || !data.groups[groupId]) return;

        const pos = getPosition(node, data.groups[groupId], data.constants);
        const nodeWithPos = { ...node, x: pos.x, y: pos.y, id: parseInt(id) || 0 };
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

    return { nodes: calculatedNodes, connections: calculatedConnections };
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
        initialScale={0.15}
        minScale={0.01}
        maxScale={2}
        centerOnInit={true}
        limitToBounds={false}
      >
        <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
            <div style={{ 
                width: 20000, 
                height: 20000, 
                position: 'relative', 
                transform: 'translate(-10000px, -10000px)' 
            }}>
                <svg width="20000" height="20000" className="absolute top-0 left-0">
                    <g transform="translate(10000, 10000)">
                        {connections.map(conn => (
                            <line 
                                key={conn.key}
                                x1={conn.x1} 
                                y1={conn.y1} 
                                x2={conn.x2} 
                                y2={conn.y2} 
                                stroke="#333" 
                                strokeWidth="5" 
                            />
                        ))}
                    </g>
                </svg>
                <div className="absolute" style={{ left: 10000, top: 10000 }}>
                    {nodes.map(node => (
                        <div
                            key={node.skill || node.id}
                            className={`absolute rounded-full border border-gray-600 flex items-center justify-center group
                                ${node.isKeystone ? 'w-24 h-24 bg-red-900 z-20' : node.isNotable ? 'w-16 h-16 bg-yellow-700 z-10' : 'w-8 h-8 bg-gray-800 z-0'}
                            `}
                            style={{
                                left: node.x,
                                top: node.y,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                             <div className="hidden group-hover:block absolute bottom-full mb-2 p-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
                                <div className="font-bold">{node.name}</div>
                                {node.stats?.map((s, i) => <div key={i}>{s}</div>)}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
