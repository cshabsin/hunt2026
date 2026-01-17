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
  MarkerType,
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

const GraphViewer = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const loadGraph = async () => {
      try {
        const response = await fetch('/grid.json');
        const data: GraphvizJson = await response.json();

        // Map GVID to Name for easier edge creation
        const gvidToId = new Map<number, string>();

        const newNodes = (data.objects || [])
          .filter((obj) => obj.name !== 'Grid') // Skip the root graph object
          .map((obj) => {
            gvidToId.set(obj._gvid, obj.name);

            // Parse position "x,y" (Graphviz uses bottom-left origin, ReactFlow uses top-left)
            // We'll just take x,y directly, but might need to flip Y if it looks upside down.
            // Usually Graphviz JSON pos is in points.
            let x = 0;
            let y = 0;
            if (obj.pos) {
              const parts = obj.pos.split(',');
              x = parseFloat(parts[0]);
              y = -parseFloat(parts[1]); // Flip Y because screen coords are top-down
            }

            // Determine style
            let background = '#fff';
            if (obj.fillcolor) background = obj.fillcolor;
            else if (obj.style && obj.style.includes('filled')) background = 'lightblue'; // Default from your dot file

            return {
              id: obj.name,
              position: { x, y },
              data: { label: obj.label || obj.name },
              style: { 
                backgroundColor: background,
                border: '1px solid #777',
                borderRadius: '4px',
                padding: '10px',
                width: 100, // Approximate width
                textAlign: 'center',
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
             type: 'smoothstep', // or 'bezier', 'straight'
           };
        }).filter(Boolean) as Edge[];

        setNodes(newNodes as any);
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
      </ReactFlow>
    </div>
  );
};

export default GraphViewer;