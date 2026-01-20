'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Node for the Chain (Yellow -> Blue -> Yellow)
const ChainNode = ({ data }: { data: { left: string, center: string, right: string } }) => {
  return (
    <div className="flex items-center border border-gray-500 rounded bg-white shadow-md overflow-hidden">
        <Handle type="target" position={Position.Left} className="!bg-gray-500" />
        
        {/* Left Yellow */}
        <div className="bg-yellow-200 p-2 border-r border-gray-300 min-w-[80px] text-center text-xs">
            {data.left}
        </div>

        {/* Center Blue */}
        <div className="bg-blue-200 p-2 font-bold min-w-[100px] text-center text-sm">
            {data.center}
        </div>

        {/* Right Yellow */}
        <div className="bg-yellow-200 p-2 border-l border-gray-300 min-w-[80px] text-center text-xs">
            {data.right}
        </div>

        <Handle type="source" position={Position.Right} className="!bg-gray-500" />
    </div>
  );
};

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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  // Store original state to revert
  const [originalNodes, setOriginalNodes] = useState<Node[]>([]);
  const [originalEdges, setOriginalEdges] = useState<Edge[]>([]);
  const [isGrouped, setIsGrouped] = useState(false);

  const nodeTypes = useMemo(() => ({ chain: ChainNode }), []);

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
              data: { label: label, isYellow }, // Keep track of color for logic
              style: { 
                backgroundColor: background,
                border: '1px solid #777',
                borderRadius: '4px',
                padding: '10px',
                width: 100, 
                textAlign: 'center',
                color: '#000', 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
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
           };
        }).filter(Boolean) as Edge[];

        setNodes(newNodes as any);
        setEdges(newEdges);
        
        // Save copy
        setOriginalNodes(newNodes as any);
        setOriginalEdges(newEdges);

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

  const toggleGrouping = useCallback(() => {
      if (isGrouped) {
          // Revert
          setNodes(originalNodes);
          setEdges(originalEdges);
          setIsGrouped(false);
          return;
      }

      // Grouping Logic
      const blueNodes = originalNodes.filter(n => !n.data.isYellow);
      const yellowNodes = originalNodes.filter(n => n.data.isYellow);
      
      const processedNodes = new Set<string>(); // IDs of nodes that are merged
      const newNodes: Node[] = [];
      
      // Map to quickly find connections
      // blueID -> incoming yellow IDs
      const incomingYellows: Record<string, string[]> = {};
      // blueID -> outgoing yellow IDs
      const outgoingYellows: Record<string, string[]> = {};

      originalEdges.forEach(e => {
          const sourceNode = originalNodes.find(n => n.id === e.source);
          const targetNode = originalNodes.find(n => n.id === e.target);
          
          if (!sourceNode || !targetNode) return;

          // Case 1: Yellow -> Blue
          if (sourceNode.data.isYellow && !targetNode.data.isYellow) {
              if (!incomingYellows[targetNode.id]) incomingYellows[targetNode.id] = [];
              incomingYellows[targetNode.id].push(sourceNode.id);
          }

          // Case 2: Blue -> Yellow
          if (!sourceNode.data.isYellow && targetNode.data.isYellow) {
              if (!outgoingYellows[sourceNode.id]) outgoingYellows[sourceNode.id] = [];
              outgoingYellows[sourceNode.id].push(targetNode.id);
          }
      });

      // Find Triples: Y -> B -> Y
      blueNodes.forEach(blue => {
          const ins = incomingYellows[blue.id] || [];
          const outs = outgoingYellows[blue.id] || [];

          // Strict simple chain: 1 in, 1 out
          // (We could handle more complex cases, but visual requirement was "separate rectangles" implying 3 parts)
          if (ins.length === 1 && outs.length === 1) {
              const yInId = ins[0];
              const yOutId = outs[0];
              
              const yIn = originalNodes.find(n => n.id === yInId)!;
              const yOut = originalNodes.find(n => n.id === yOutId)!;

              // Create Super Node
              // Position it at the Blue node's position (or average?)
              // Blue position seems fine.
              
              const superNode: Node = {
                  id: `group-${blue.id}`,
                  position: blue.position,
                  type: 'chain',
                  data: {
                      left: yIn.data.label,
                      center: blue.data.label,
                      right: yOut.data.label
                  },
                  // We don't set style because the custom node handles it
              };

              newNodes.push(superNode);
              
              // Mark as processed
              processedNodes.add(blue.id);
              processedNodes.add(yInId);
              processedNodes.add(yOutId);
          }
      });

      // Add remaining nodes that weren't grouped
      originalNodes.forEach(n => {
          if (!processedNodes.has(n.id)) {
              newNodes.push(n);
          }
      });

      // Rebuild Edges
      // We need to map old IDs to new IDs (if grouped)
      // Group ID map: oldId -> newGroupId
      const idMap: Record<string, string> = {};
      newNodes.forEach(n => {
          if (n.id.startsWith('group-')) {
               // The group replaces the blue node and its two yellows.
               // We need to know which old IDs map to this new group.
               // We can re-derive or store it. 
               // Let's iterate the groups we made.
          }
      });

      // Actually, easier way:
      // Filter edges.
      // 1. Edges internal to the group (Y->B, B->Y) should be removed.
      // 2. Edges connecting to the group from outside need to be updated.
      
      const newEdges: Edge[] = [];
      
      originalEdges.forEach(e => {
          const sourceProcessed = processedNodes.has(e.source);
          const targetProcessed = processedNodes.has(e.target);

          if (!sourceProcessed && !targetProcessed) {
              // Untouched edge
              newEdges.push(e);
          } else if (sourceProcessed && targetProcessed) {
              // Internal edge? Or edge between two different groups?
              // Check if they belong to the SAME group.
              // To do this efficiently, we need a map: nodeId -> groupId
          }
      });
      
      // Let's build the map first
      const nodeToGroup: Record<string, string> = {};
      
      // Re-iterate the logic to build the map (or refactor above loop)
      // Refactoring slightly for clarity/correctness
      const finalNodesList: Node[] = [];
      const processedSet = new Set<string>();

      blueNodes.forEach(blue => {
          const ins = incomingYellows[blue.id] || [];
          const outs = outgoingYellows[blue.id] || [];

          if (ins.length === 1 && outs.length === 1) {
              const yInId = ins[0];
              const yOutId = outs[0];
              const groupId = `group-${blue.id}`;
              
              nodeToGroup[blue.id] = groupId;
              nodeToGroup[yInId] = groupId;
              nodeToGroup[yOutId] = groupId;
              processedSet.add(blue.id);
              processedSet.add(yInId);
              processedSet.add(yOutId);

              const yIn = originalNodes.find(n => n.id === yInId)!;
              const yOut = originalNodes.find(n => n.id === yOutId)!;

              finalNodesList.push({
                  id: groupId,
                  position: blue.position,
                  type: 'chain',
                  data: {
                      left: yIn.data.label,
                      center: blue.data.label,
                      right: yOut.data.label
                  }
              });
          }
      });
      
      originalNodes.forEach(n => {
          if (!processedSet.has(n.id)) {
              finalNodesList.push(n);
          }
      });

      // Now edges
      originalEdges.forEach(e => {
          const sGroup = nodeToGroup[e.source];
          const tGroup = nodeToGroup[e.target];

          if (sGroup && tGroup && sGroup === tGroup) {
              // Internal edge (Y->B or B->Y within same group), drop it
              return;
          }

          // Remap source/target if they are part of a group
          const newSource = sGroup || e.source;
          const newTarget = tGroup || e.target;
          
          newEdges.push({
              ...e,
              id: `e-${newSource}-${newTarget}-${e.id}`, // Ensure unique ID
              source: newSource,
              target: newTarget
          });
      });

      setNodes(finalNodesList);
      setEdges(newEdges);
      setIsGrouped(true);

  }, [isGrouped, originalNodes, originalEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
        <Panel position="top-right">
            <button 
                onClick={toggleGrouping}
                style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    backgroundColor: isGrouped ? '#f0f0f0' : '#2563eb',
                    color: isGrouped ? '#333' : 'white',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
            >
                {isGrouped ? "Ungroup Chains" : "Group Chains"}
            </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default GraphViewer;