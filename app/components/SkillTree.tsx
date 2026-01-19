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

  const { nodes, connections, pathSet, pathNodes, steps } = useMemo(() => {
    if (!data) return { nodes: [], connections: [], pathSet: new Set(), pathNodes: new Set(), steps: 0 };

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

        // 2. Calculate connections and adjacency list for pathfinding

        const seenConnections = new Set<string>();

        const adjacency = new Map<number, number[]>();

    

        const addNeighbor = (id1: number, id2: number) => {

            if (!adjacency.has(id1)) adjacency.set(id1, []);

            if (!adjacency.has(id2)) adjacency.set(id2, []);

            adjacency.get(id1)?.push(id2);

            adjacency.get(id2)?.push(id1);

        };

    

        calculatedNodes.forEach(node => {

            const nodeId = node.skill || node.id;

            if (node.out) {

                node.out.forEach(targetIdStr => {

                    const targetId = parseInt(targetIdStr);

                    const target = nodesMap.get(targetIdStr); // nodesMap keys are strings

                    

                    if (target) {

                        addNeighbor(nodeId, targetId);

    

                        const id1 = Math.min(nodeId, targetId);

                        const id2 = Math.max(nodeId, targetId);

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

    

        // 3. Find Shortest Path (BFS)

        const startNodeId = 52031; // Disintegration

        const endNodeId = 52714;   // Prowess

        const pathSet = new Set<string>();

        const pathNodes = new Set<number>();

        let steps = 0;

    

        const queue: { id: number; path: number[] }[] = [{ id: startNodeId, path: [startNodeId] }];

        const visited = new Set<number>();

        visited.add(startNodeId);

    

        while (queue.length > 0) {

            const { id, path } = queue.shift()!;

            if (id === endNodeId) {

                steps = path.length - 1; // Steps = edges, not nodes

                path.forEach(nodeId => pathNodes.add(nodeId));

                

                // Create connection keys for the path

                for (let i = 0; i < path.length - 1; i++) {

                    const n1 = path[i];

                    const n2 = path[i+1];

                    pathSet.add(`${Math.min(n1, n2)}-${Math.max(n1, n2)}`);

                }

                break;

            }

    

            const neighbors = adjacency.get(id) || [];

            for (const neighbor of neighbors) {

                if (!visited.has(neighbor)) {

                    visited.add(neighbor);

                    queue.push({ id: neighbor, path: [...path, neighbor] });

                }

            }

        }

    

        return { 

            nodes: calculatedNodes, 

            connections: calculatedConnections, 

            pathSet, 

            pathNodes,

            steps 

        };

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

        <div className="w-full h-screen bg-gray-900 overflow-hidden relative">

           <div className="absolute top-4 left-4 z-50 bg-gray-900/90 border border-yellow-600 text-yellow-500 p-4 rounded shadow-lg backdrop-blur-sm">

              <h2 className="text-lg font-bold mb-2">Pathfinding</h2>

              <div className="text-sm text-gray-300">

                  <span className="text-white font-semibold">Disintegration</span> → <span className="text-white font-semibold">Prowess</span>

              </div>

              <div className="text-xl font-bold mt-2 text-white">{steps > 0 ? `${steps} Steps` : 'Path not found'}</div>

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

                    background: '#050505',

                }}>

                    <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute top-0 left-0 pointer-events-none" style={{ zIndex: 1 }}>

                        {/* Draw non-path connections first (faded) */}

                        {connections.map(conn => {

                             const isPath = pathSet.has(conn.key);

                             return (

                                <line 

                                    key={conn.key}

                                    x1={conn.x1} 

                                    y1={conn.y1} 

                                    x2={conn.x2} 

                                    y2={conn.y2} 

                                    stroke={isPath ? "#00FFFF" : "#333"} 

                                    strokeWidth={isPath ? "8" : "4"} 

                                    strokeOpacity={isPath ? 1 : 0.5}

                                />

                            );

                        })}

                    </svg>

                    

                    {nodes.map(node => {

                        const nodeId = node.skill || node.id;

                        const isPath = pathNodes.has(nodeId);

                        

                        return (

                            <div

                                key={nodeId}

                                className={`absolute rounded-full flex items-center justify-center group transition-colors duration-300

                                    ${isPath ? 'z-30 shadow-[0_0_15px_rgba(0,255,255,0.8)]' : ''}

                                    ${node.isKeystone 

                                        ? (isPath ? 'bg-cyan-500 w-16 h-16 border-2 border-white' : 'bg-red-900 w-16 h-16 border-2 border-red-500 z-20') 

                                        : node.isNotable 

                                            ? (isPath ? 'bg-cyan-400 w-10 h-10 border border-white' : 'bg-yellow-700 w-10 h-10 border border-yellow-500 z-10') 

                                            : (isPath ? 'bg-cyan-300 w-6 h-6' : 'bg-gray-800 w-4 h-4 z-0')

                                    }

                                `}

                                style={{

                                    left: node.x,

                                    top: node.y,

                                    transform: 'translate(-50%, -50%)'

                                }}

                            >

                                 <div className="hidden group-hover:block absolute bottom-full mb-2 p-3 bg-gray-900/95 text-white text-xs rounded border border-gray-700 whitespace-nowrap z-50 pointer-events-none min-w-[200px] shadow-xl backdrop-blur-sm">

                                    <div className={`font-bold text-lg mb-1 ${isPath ? 'text-cyan-400' : 'text-yellow-500'}`}>{node.name}</div>

                                    {node.stats?.map((s, i) => <div key={i} className="text-gray-300 text-sm">{s}</div>)}

                                    {node.isKeystone && <div className="text-red-400 mt-2 text-[10px] uppercase tracking-wider font-bold">Keystone</div>}

                                    {node.isNotable && <div className="text-yellow-400 mt-2 text-[10px] uppercase tracking-wider font-bold">Notable</div>}

                                    {isPath && <div className="text-cyan-400 mt-2 text-[10px] uppercase tracking-wider font-bold animate-pulse">Part of Shortest Path</div>}

                                 </div>

                            </div>

                        );

                    })}

                </div>

            </TransformComponent>

          </TransformWrapper>

        </div>

      );

    }

    