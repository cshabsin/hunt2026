'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Types for the Graphviz JSON output
type GraphvizNode = {
  _gvid: number;
  name: string;
  pos?: string; // "x,y"
  fillcolor?: string;
  color?: string;
  label?: string;
  style?: string;
};

type GraphvizEdge = {
  tail: number;
  head: number;
  _gvid: number;
};

type GraphvizJson = {
  objects: GraphvizNode[];
  edges: GraphvizEdge[];
  bb: string; // bounding box "x,y,w,h"
};

const BLUE_NODE_WIDTH = 150;
const YELLOW_NODE_WIDTH = 120;
const LEVEL_HEIGHT = 400; // Vertical spacing between blue levels
const BLUE_SPACING_X = 600; // Horizontal spacing between blue nodes to fit yellows

const GraphViewer = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [originalNodes, setOriginalNodes] = useState<Node[]>([]);
  const [isTreeLayout, setIsTreeLayout] = useState(false);

  useEffect(() => {
    const loadGraph = async () => {
      try {
        const response = await fetch('grid.json');
        const data: GraphvizJson = await response.json();

        // Map GVID to Name for easier edge creation
        const gvidToId = new Map<number, string>();

        const newNodes = (data.objects || [])
          .filter((obj) => obj.name !== 'Grid') // Skip the root graph object
          .map((obj) => {
            gvidToId.set(obj._gvid, obj.name);

            let x = 0;
            let y = 0;
            if (obj.pos) {
              const parts = obj.pos.split(',');
              x = parseFloat(parts[0]);
              y = -parseFloat(parts[1]); 
            }

            // Determine style
            let background = '#fff';
            if (obj.fillcolor) background = obj.fillcolor;
            else if (obj.style && obj.style.includes('filled')) background = 'lightblue'; 

            const label = (obj.label && obj.label !== '\\N') ? obj.label : obj.name;
            const isYellow = background === 'yellow';

            return {
              id: obj.name,
              position: { x, y },
              data: { label: label, isYellow },
              style: { 
                backgroundColor: background,
                border: '1px solid #777',
                borderRadius: '4px',
                padding: '10px',
                width: isYellow ? YELLOW_NODE_WIDTH : BLUE_NODE_WIDTH, 
                textAlign: 'center',
                color: '#000', 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: isYellow ? '12px' : '14px',
                fontWeight: isYellow ? 'normal' : 'bold',
              },
            };
          });

        const newEdges = (data.edges || []).map((edge, i) => {
           const source = gvidToId.get(edge.tail);
           const target = gvidToId.get(edge.head);
           
           if (!source || !target) return null;

           return {
             id: `e-${i}`,
             source,
             target,
             markerEnd: {
               type: MarkerType.ArrowClosed,
             },
             type: 'smoothstep', 
             style: { strokeWidth: 2 },
           };
        }).filter(Boolean) as Edge[];

        setNodes(newNodes as any);
        setOriginalNodes(newNodes as any);
        setEdges(newEdges);

      } catch (err) {
        console.error("Failed to load graph data", err);
      }
    };

    loadGraph();
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const applyTreeLayout = useCallback(() => {
      if (isTreeLayout) {
          // Revert
          setNodes(originalNodes);
          setIsTreeLayout(false);
          return;
      }

      // 1. Separate Blue and Yellow
      const blueNodes = nodes.filter(n => !n.data.isYellow);
      
      // 2. Build Blue Graph structure (Adjacency List)
      const blueAdj: Record<string, string[]> = {};
      const blueInDegree: Record<string, number> = {};
      
      // Initialize
      blueNodes.forEach(n => {
          blueAdj[n.id] = [];
          blueInDegree[n.id] = 0;
      });

      // Populate from edges (only Blue->Blue)
      edges.forEach(edge => {
          const isSourceBlue = !nodes.find(n => n.id === edge.source)?.data.isYellow;
          const isTargetBlue = !nodes.find(n => n.id === edge.target)?.data.isYellow;
          
          if (isSourceBlue && isTargetBlue) {
              blueAdj[edge.source].push(edge.target);
              blueInDegree[edge.target] = (blueInDegree[edge.target] || 0) + 1;
          }
      });

      // 3. Assign Levels (BFS/Topological-ish)
      const levels: Record<string, number> = {};
      const roots = blueNodes.filter(n => blueInDegree[n.id] === 0);
      
      // If cyclic or no roots, just take the first one
      const queue = roots.length > 0 ? [...roots] : [blueNodes[0]];
      queue.forEach(n => levels[n.id] = 0);
      
      const visited = new Set<string>();
      queue.forEach(n => visited.add(n.id));

      while (queue.length > 0) {
          const curr = queue.shift()!;
          const depth = levels[curr.id];
          
          const neighbors = blueAdj[curr.id] || [];
          neighbors.forEach(next => {
              if (!visited.has(next)) {
                  visited.add(next);
                  levels[next] = depth + 1;
                  queue.push(nodes.find(n => n.id === next)!);
              }
          });
      }
      
      // Handle disconnected components / unvisited nodes
      blueNodes.forEach(n => {
          if (!visited.has(n.id)) {
              levels[n.id] = 0; // Default to level 0 or handled separate
          }
      });

      // 4. Position Blue Nodes
      // Group by level
      const nodesByLevel: Record<number, Node[]> = {};
      Object.entries(levels).forEach(([id, level]) => {
          if (!nodesByLevel[level]) nodesByLevel[level] = [];
          nodesByLevel[level].push(nodes.find(n => n.id === id)!);
      });

      const newPositions: Record<string, {x: number, y: number}> = {};

      Object.entries(nodesByLevel).forEach(([lvlStr, levelNodes]) => {
          const level = parseInt(lvlStr);
          const y = level * LEVEL_HEIGHT;
          
          // Center the row? Or just start from 0? 
          // Center is nicer.
          const totalWidth = (levelNodes.length - 1) * BLUE_SPACING_X;
          const startX = -totalWidth / 2;

          levelNodes.forEach((node, idx) => {
              const x = startX + idx * BLUE_SPACING_X;
              newPositions[node.id] = { x, y };
          });
      });

      // 5. Position Yellow Nodes
      // For each blue node, find attached yellow nodes
      const yellowPositions: Record<string, {x: number, y: number}> = {};
      
      blueNodes.forEach(blue => {
          const bluePos = newPositions[blue.id];
          if (!bluePos) return;

          // Find connected yellow nodes (Source is blue, Target is Yellow OR Target is Blue, Source is Yellow)
          // Usually notes are attached TO the node or FROM the node.
          // Let's look at all edges connected to this blue node.
          const attachedYellows: string[] = [];
          
          edges.forEach(edge => {
              if (edge.source === blue.id) {
                  const targetNode = nodes.find(n => n.id === edge.target);
                  if (targetNode?.data.isYellow) attachedYellows.push(targetNode.id);
              }
              if (edge.target === blue.id) {
                  const sourceNode = nodes.find(n => n.id === edge.source);
                  if (sourceNode?.data.isYellow) attachedYellows.push(sourceNode.id);
              }
          });

          // Unique yellows for this blue node (simple check)
          const uniqueYellows = [...new Set(attachedYellows)];
          
          // Distribute Left and Right
          // Odd to left, Even to right?
          const leftYellows = uniqueYellows.filter((_, i) => i % 2 === 0);
          const rightYellows = uniqueYellows.filter((_, i) => i % 2 !== 0);

          leftYellows.forEach((yId, i) => {
              yellowPositions[yId] = {
                  x: bluePos.x - (BLUE_NODE_WIDTH/2 + 50 + YELLOW_NODE_WIDTH/2) - (i * (YELLOW_NODE_WIDTH + 10)),
                  y: bluePos.y + (i * 30) // Slight stagger if multiple?
              };
          });

          rightYellows.forEach((yId, i) => {
              yellowPositions[yId] = {
                  x: bluePos.x + (BLUE_NODE_WIDTH/2 + 50 + YELLOW_NODE_WIDTH/2) + (i * (YELLOW_NODE_WIDTH + 10)),
                  y: bluePos.y + (i * 30)
              };
          });
      });

      // Update all nodes
      const finalNodes = nodes.map(n => {
          if (newPositions[n.id]) {
              return { ...n, position: newPositions[n.id] };
          }
          if (yellowPositions[n.id]) {
              return { ...n, position: yellowPositions[n.id] };
          }
          return n;
      });

      setNodes(finalNodes);
      setIsTreeLayout(true);

  }, [nodes, edges, isTreeLayout, originalNodes, setNodes]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
        <Panel position="top-right">
            <button 
                onClick={applyTreeLayout}
                style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    backgroundColor: isTreeLayout ? '#f0f0f0' : '#2563eb',
                    color: isTreeLayout ? '#333' : 'white',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
            >
                {isTreeLayout ? "Reset Layout" : "Tree Layout"}
            </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default GraphViewer;