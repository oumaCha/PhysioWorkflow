import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import StageNode from "./nodes/StageNode";
import NoteNode from "./nodes/NoteNode";
import BadgeNode from "./nodes/BadgeNode";
import LaneNode from "./nodes/LaneNode";

import { initialEdges, initialNodes } from "./initialDiagram";

const nodeTypes = {
  stage: StageNode,
  note: NoteNode,
  badge: BadgeNode,
  lane: LaneNode,
};

const thickRed = {
  stroke: "#c81e1e",
  strokeWidth: 5,
};

export default function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, color: "#c81e1e" },
            style: thickRed,
          },
          eds
        )
      ),
    [setEdges]
  );

  // Tablet-friendly viewport
  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.9 }), []);

  return (
    <div style={{ height: "78vh", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        defaultViewport={defaultViewport}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
