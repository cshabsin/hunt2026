'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { SkillTreeData, SkillNode } from '../types';
import { getPosition } from '../utils/geometry';

interface NodeWithPosition extends SkillNode {
  x: number;
  y: number;
}

const CANVAS_WIDTH = 22000;
const CANVAS_HEIGHT = 18000;
const OFFSET_X = CANVAS_WIDTH / 2;
const OFFSET_Y = CANVAS_HEIGHT / 2;

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
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    Object.entries(data.nodes).forEach(([id, node]) => {
        // Skip root or nodes without group
        const groupId = node.group;
        if (groupId === undefined || !data.groups[groupId]) return;

        const pos = getPosition(node, data.groups[groupId], data.constants);
        
        // Update bounds for debug
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x);
        maxY = Math.max(maxY, pos.y);

        // Apply offset to center the tree in the positive coordinate space
        const x = pos.x + OFFSET_X;
        const y = pos.y + OFFSET_Y;

        const nodeWithPos = { ...node, x, y, id: parseInt(id) || 0 };
        nodesMap.set(id, nodeWithPos);
        calculatedNodes.push(nodeWithPos);
    });

    console.log(`[SkillTree] Calculated ${calculatedNodes.length} nodes.`);
    console.log(`[SkillTree] Bounds (Original): X[${minX.toFixed(0)}, ${maxX.toFixed(0)}] Y[${minY.toFixed(0)}, ${maxY.toFixed(0)}]`);
    console.log(`[SkillTree] Canvas Size: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`);
    
    if (calculatedNodes.length > 0) {
        console.log(`[SkillTree] Sample Node 0:`, calculatedNodes[0]);
    }

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
    <div className="w-full h-screen bg-gray-900 overflow-hidden border-4 border-red-500 relative">
      <div className="absolute top-0 left-0 z-50 bg-white text-black p-2 opacity-75">
          Debug: {nodes.length} nodes loaded. Map size: {CANVAS_WIDTH}x{CANVAS_HEIGHT}.
      </div>
      <TransformWrapper
        initialScale={0.2}
        minScale={0.05}
        maxScale={2}
        centerOnInit={true}
        limitToBounds={false}
      >
        <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
            <div style={{ 
                width: CANVAS_WIDTH, 
                height: CANVAS_HEIGHT, 
                position: 'relative',
                background: '#111',
                overflow: 'visible' // Ensure no clipping
            }}>
                <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute top-0 left-0 pointer-events-none" style={{ zIndex: 1 }}>
                    {connections.map(conn => (
                        <line 
                            key={conn.key}
                            x1={conn.x1} 
                            y1={conn.y1} 
                            x2={conn.x2} 
                            y2={conn.y2} 
                            stroke="#555" 
                            strokeWidth="4" 
                        />
                    ))}
                </svg>
                
                {nodes.map(node => (
                    <div
                        key={node.skill || node.id}
                        className="absolute bg-green-500 rounded-full"
                        style={{
                            left: node.x,
                            top: node.y,
                            width: node.isKeystone ? 40 : (node.isNotable ? 20 : 10),
                            height: node.isKeystone ? 40 : (node.isNotable ? 20 : 10),
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10
                        }}
                        title={node.name}
                    />
                ))}
            </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}