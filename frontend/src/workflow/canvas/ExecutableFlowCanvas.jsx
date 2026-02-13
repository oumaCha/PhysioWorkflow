import { useEffect, useMemo, useState, useCallback } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useEdgesState,
    useNodesState,
    useReactFlow,
    ReactFlowProvider,
    addEdge,
    MarkerType,
    ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import WfNode from "./nodes/WfNode";

const nodeTypes = { wf: WfNode };

// ✅ Default node size (prevents giant nodes)
const DEFAULT_W = 240;
const DEFAULT_H = 86;

function kindOf(node) {
    return String(node?.data?.kind || "TASK").toUpperCase();
}

function canConnect(sourceNode, targetNode) {
    const s = kindOf(sourceNode);
    const t = kindOf(targetNode);

    if (String(sourceNode?.id) === String(targetNode?.id)) return false; // no self loop
    if (t === "START") return false; // start has no incoming
    if (s === "END") return false; // end has no outgoing
    if (s === "ACTOR" || t === "ACTOR") return false; // actor not connectable

    return true;
}

// ✅ Flexible arrows like your reference image
const defaultEdgeOptions = {
    type: "bezier",
    style: { stroke: "#94a3b8", strokeWidth: 2 },
    markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: "#94a3b8",
    },
};

const safeUUID = () =>
    globalThis.crypto?.randomUUID?.() ??
    `n_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export default function ExecutableFlowCanvas(props) {
    return (
        <ReactFlowProvider>
            <InnerCanvas {...props} />
        </ReactFlowProvider>
    );
}

function InnerCanvas({
                         nodes: inputNodes = [],
                         edges: inputEdges = [],
                         layout = {},
                         tasks = [],
                         activeNodeId,
                         onLayoutChange,
                         onGraphChange,
                         onNodeSelect,
                         allowDropTools = false,
                         apiRef,
                     }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { screenToFlowPosition } = useReactFlow();
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    const completedSet = useMemo(() => {
        const s = new Set();
        for (const t of tasks || []) {
            if (t?.status === "COMPLETED" && t?.nodeId) s.add(String(t.nodeId));
        }
        return s;
    }, [tasks]);

    // load nodes/edges from props
    useEffect(() => {
        setNodes(inputNodes || []);
        setEdges(inputEdges || []);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedNodeId((prev) => {
            if (!prev) return null;
            return (inputNodes || []).some((n) => String(n.id) === String(prev)) ? prev : null;
        });
    }, [inputNodes, inputEdges, setNodes, setEdges]);

    // ✅ enforce size + apply layout + highlight states
    useEffect(() => {
        setNodes((prev) =>
            (prev || []).map((n) => {
                const id = String(n.id);
                const isActive = activeNodeId != null && String(activeNodeId) === id;
                const isCompleted = completedSet.has(id);
                const isSelected = selectedNodeId != null && String(selectedNodeId) === id;

                const pos = layout?.[id];
                const position =
                    pos && typeof pos.x === "number" && typeof pos.y === "number" ? pos : n.position;

                return {
                    ...n,
                    position,
                    width: DEFAULT_W,
                    height: DEFAULT_H,
                    style: {
                        ...(n.style || {}),
                        width: DEFAULT_W,
                        height: DEFAULT_H,
                        opacity: isActive || isCompleted || isSelected ? 1 : 0.55,
                    },
                    data: {
                        ...(n.data || {}),
                        __exec: { isActive, isCompleted, isSelected },
                    },
                };
            })
        );
    }, [layout, activeNodeId, completedSet, selectedNodeId, setNodes]);

    const notifyGraphChange = useCallback(
        (nextNodes, nextEdges) => {
            if (typeof onGraphChange === "function") onGraphChange(nextNodes, nextEdges);
        },
        [onGraphChange]
    );

    // save layout on drag stop
    const onNodeDragStop = useCallback(
        (_evt, node) => {
            if (!onLayoutChange) return;
            const id = String(node.id);
            onLayoutChange({
                ...(layout || {}),
                [id]: { x: node.position.x, y: node.position.y },
            });
        },
        [onLayoutChange, layout]
    );

    // toolbox drops
    const onDragOver = useCallback(
        (e) => {
            if (!allowDropTools) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        },
        [allowDropTools]
    );

    const onDrop = useCallback(
        (e) => {
            if (!allowDropTools) return;
            e.preventDefault();

            try {
                const raw = e.dataTransfer.getData("application/x-workflow-tool");
                if (!raw) return;

                const tool = JSON.parse(raw);
                const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
                const newNodeId = safeUUID();

                const newNode = {
                    id: newNodeId,
                    type: "wf",
                    position,
                    width: DEFAULT_W,
                    height: DEFAULT_H,
                    style: { width: DEFAULT_W, height: DEFAULT_H },
                    data: {
                        label: tool.label,
                        role: tool.role,
                        icon: tool.icon,
                        subtitle: tool.subtitle || "",
                        toolKey: tool.key,
                        kind: tool.kind || "TASK",
                        nodeType: tool.kind || "TASK",
                    },
                };

                setNodes((prev) => {
                    const nextNodes = prev.concat(newNode);

                    setEdges((prevEdges) => {
                        let nextEdges = prevEdges;
                        const fromId = selectedNodeId;

                        if (fromId) {
                            const sourceNode = nextNodes.find((n) => String(n.id) === String(fromId));
                            if (sourceNode && canConnect(sourceNode, newNode)) {
                                nextEdges = prevEdges.concat({
                                    id: `e_${fromId}_${newNodeId}_${Date.now()}`,
                                    source: fromId,
                                    target: newNodeId,
                                });
                            }
                        }

                        notifyGraphChange(nextNodes, nextEdges);
                        return nextEdges;
                    });

                    setSelectedNodeId(newNodeId);
                    return nextNodes;
                });
            } catch (err) {
                console.error("Drop failed:", err);
            }
        },
        [allowDropTools, screenToFlowPosition, selectedNodeId, notifyGraphChange, setNodes, setEdges]
    );

    // manual connect (drag handle to handle)
    const onConnect = useCallback(
        (params) => {
            setEdges((prevEdges) => {
                const sourceNode = nodes.find((n) => String(n.id) === String(params.source));
                const targetNode = nodes.find((n) => String(n.id) === String(params.target));
                if (!sourceNode || !targetNode) return prevEdges;
                if (!canConnect(sourceNode, targetNode)) return prevEdges;

                const nextEdges = addEdge(
                    { ...params, id: `e_${params.source}_${params.target}_${Date.now()}` },
                    prevEdges
                );

                notifyGraphChange(nodes, nextEdges);
                return nextEdges;
            });
        },
        [nodes, notifyGraphChange, setEdges]
    );

    // click node = set insertion point
    const onNodeClick = useCallback(
        (_evt, node) => {
            setSelectedNodeId(String(node.id));
            if (typeof onNodeSelect === "function") onNodeSelect(node);
        },
        [onNodeSelect]
    );

    // API hook (optional)
    useEffect(() => {
        if (!apiRef) return;

        apiRef.current = {
            addTool: (tool) => {
                const newNodeId = safeUUID();
                const newNode = {
                    id: newNodeId,
                    type: "wf",
                    position: { x: 120, y: 120 },
                    width: DEFAULT_W,
                    height: DEFAULT_H,
                    style: { width: DEFAULT_W, height: DEFAULT_H },
                    data: {
                        label: tool.label,
                        role: tool.role,
                        icon: tool.icon,
                        subtitle: tool.subtitle || "",
                        toolKey: tool.key,
                        kind: tool.kind || "TASK",
                        nodeType: tool.kind || "TASK",
                    },
                };

                setNodes((prevNodes) => {
                    const nextNodes = prevNodes.concat(newNode);
                    notifyGraphChange(nextNodes, edges);
                    return nextNodes;
                });

                setSelectedNodeId(newNodeId);
            },
        };

        return () => (apiRef.current = null);
    }, [apiRef, setNodes, notifyGraphChange, edges]);

    return (
        <div className="wfCanvasShell" onDragOver={onDragOver} onDrop={onDrop}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                connectionLineType={ConnectionLineType.Bezier}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onNodeDragStop={onNodeDragStop}
                fitView
                proOptions={{ hideAttribution: true }}
            >
                <Background variant="dots" gap={24} size={1} color="rgba(148,163,184,0.55)" />
                <Controls />
                <MiniMap nodeColor={() => "#94a3b8"} maskColor="rgba(15,23,42,0.08)" />
            </ReactFlow>
        </div>
    );
}


