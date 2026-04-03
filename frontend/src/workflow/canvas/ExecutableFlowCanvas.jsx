import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
    applyNodeChanges,
    applyEdgeChanges,
    ControlButton,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import WfNode from "./nodes/WfNode";

const nodeTypes = { wf: WfNode };

// Default node size on creation only
const DEFAULT_W = 240;
const DEFAULT_H = 86;

function kindOf(node) {
    return String(node?.data?.kind || "TASK").toUpperCase();
}

function canConnect(sourceNode, targetNode) {
    const s = kindOf(sourceNode);
    const t = kindOf(targetNode);

    if (String(sourceNode?.id) === String(targetNode?.id)) return false;
    if (t === "START") return false;
    if (s === "END") return false;
    if (s === "ACTOR" || t === "ACTOR") return false;

    return true;
}


function MenuItem({ label, shortcut, onClick, danger, disabled }) {
    return (
        <button
            type="button"
            className={`wfMenuItem ${danger ? "wfMenuItemDanger" : ""}`}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
        >
            <span>{label}</span>
            {shortcut ? <span className="wfMenuShortcut">{shortcut}</span> : null}
        </button>
    );
}

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
                         viewport: inputViewport = null, // <-- IMPORTANT
                         tasks = [],
                         activeNodeId,
                         focusNodeId,
                         onGraphChange, // (nodes, edges, viewport)
                         onNodeSelect,
                         allowDropTools = false,
                         apiRef,
                         onToolDropped,
                     }) {
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);
    const { screenToFlowPosition } = useReactFlow();
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    const [locked, setLocked] = useState(false);

    const nodesRef = useRef([]);
    const edgesRef = useRef([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    const reactFlowRef = useRef(null);
    // clipboard + history
    const clipboardRef = useRef(null);
    const ctxMenuRef = useRef(null);
    const historyRef = useRef({
        past: [],
        future: [],
    });
    const saveTimer = useRef(null);

    // ---- Context menu state (responsive + touch-friendly)
    const [ctxMenu, setCtxMenu] = useState({
        open: false,
        x: 0,
        y: 0,
        scope: "pane", // "pane" | "node"
        nodeId: null,
    });

    const closeCtxMenu = useCallback(() => {
        setCtxMenu((m) => ({ ...m, open: false, nodeId: null, scope: "pane" }));
    }, []);

    const openCtxMenuAt = useCallback((clientX, clientY, scope = "pane", nodeId = null) => {
        const PAD = 8;
        const MENU_W = 220; // good for tablet too
        const MENU_H = 260; // rough max height

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // clamp so menu never goes off-screen
        const x = Math.min(clientX, vw - MENU_W - PAD);
        const y = Math.min(clientY, vh - MENU_H - PAD);

        setCtxMenu({ open: true, x: Math.max(PAD, x), y: Math.max(PAD, y), scope, nodeId });
    }, []);


    const longPressRef = useRef({
        timer: null,
        startX: 0,
        startY: 0,
        active: false,
        scope: "pane",
        nodeId: null,
    });

    // keep refs fresh
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    useEffect(() => {
        edgesRef.current = edges;
    }, [edges]);

    // completed tasks set
    const completedSet = useMemo(() => {
        const s = new Set();
        for (const t of tasks || []) {
            if (t?.status === "COMPLETED" && t?.nodeId) s.add(String(t.nodeId));
        }
        return s;
    }, [tasks]);

    const openSet = useMemo(() => {
        const s = new Set();
        for (const t of tasks || []) {
            if (t?.status === "OPEN" && t?.nodeId) s.add(String(t.nodeId));
        }
        return s;
    }, [tasks]);






    // hydrate from props (overlay)
    useEffect(() => {
        setNodes(inputNodes || []);
        setEdges(inputEdges || []);
        setSelectedNodeId((prev) => {
            if (!prev) return null;
            return (inputNodes || []).some((n) => String(n.id) === String(prev))
                ? prev
                : null;
        });
    }, [inputNodes, inputEdges, setNodes, setEdges]);

    // restore viewport (overlay)
    useEffect(() => {
        if (!inputViewport) return;
        if (!reactFlowRef.current?.setViewport) return;

        // restore instantly (no animation)
        reactFlowRef.current.setViewport(inputViewport, { duration: 0 });
    }, [inputViewport]);



    useEffect(() => {
        if (!focusNodeId) return;
        const rf = reactFlowRef.current;
        if (!rf) return;

        // try to find the node
        const node =
            (typeof rf.getNode === "function" ? rf.getNode(String(focusNodeId)) : null) ||
            (nodesRef.current || []).find((n) => String(n.id) === String(focusNodeId));

        if (!node) return;

        const x = (node.position?.x || 0) + (node.width || node.style?.width || 240) / 2;
        const y = (node.position?.y || 0) + (node.height || node.style?.height || 86) / 2;

        // smooth center
        if (typeof rf.setCenter === "function") {
            rf.setCenter(x, y, { zoom: 1.1, duration: 300 });
        } else if (typeof rf.fitView === "function") {
            rf.fitView({ nodes: [{ id: String(focusNodeId) }], padding: 0.35, duration: 300 });
        }
    }, [focusNodeId]);



    // apply highlight state (DO NOT overwrite width/height!)
    useEffect(() => {
        setNodes((prev) =>
            (prev || []).map((n) => {
                const id = String(n.id);
                const isActive = activeNodeId != null && String(activeNodeId) === id;
                const isCompleted = completedSet.has(id);
                const isOpen = openSet.has(id);
                const isSelected = selectedNodeId != null && String(selectedNodeId) === id;

                return {
                    ...n,
                    style: (() => {
                        const next = {
                            ...(n.style || {}),
                            opacity: 1,
                            filter: "none",
                        };

                        // remove any old rectangle selection styles
                        delete next.boxShadow;
                        delete next.outline;

                        return next;


                    })(),
                    data: {
                        ...(n.data || {}),
                        __exec: { isActive, isCompleted, isOpen, isSelected },
                    },
                };

            })
        );
            }, [activeNodeId, completedSet, openSet, selectedNodeId, setNodes]
            );




    const persistOverlay = useCallback(
        (nextNodes, nextEdges) => {
            if (typeof onGraphChange !== "function") return;

            // debounce so we don't spam PUT on every mousemove
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                const viewport = reactFlowRef.current?.getViewport?.();
                onGraphChange(nextNodes, nextEdges, viewport);
            }, 250);
        },
        [onGraphChange]
    );

    const commitHistory = useCallback((nextNodes, nextEdges) => {
        historyRef.current.past.push({
            nodes: nodesRef.current,
            edges: edgesRef.current,
        });

        if (historyRef.current.past.length > 50) {
            historyRef.current.past.shift();
        }

        historyRef.current.future = [];
    }, []);

    const undo = useCallback(() => {
        const past = historyRef.current.past;
        if (!past.length) return;

        const prev = past.pop();

        historyRef.current.future.unshift({
            nodes: nodesRef.current,
            edges: edgesRef.current,
        });

        setNodes(prev.nodes);
        setEdges(prev.edges);

        queueMicrotask(() => persistOverlay(prev.nodes, prev.edges));
    }, [persistOverlay, setNodes, setEdges]);

    const redo = useCallback(() => {
        const future = historyRef.current.future;
        if (!future.length) return;

        const next = future.shift();

        historyRef.current.past.push({
            nodes: nodesRef.current,
            edges: edgesRef.current,
        });

        setNodes(next.nodes);
        setEdges(next.edges);

        queueMicrotask(() => persistOverlay(next.nodes, next.edges));
    }, [persistOverlay, setNodes, setEdges]);


    const deleteSelection = useCallback(() => {
        const curNodes = nodesRef.current;
        const curEdges = edgesRef.current;

        const selectedIds = new Set(
            curNodes.filter(n => n.selected).map(n => String(n.id))
        );

        if (!selectedIds.size) return;

        commitHistory(curNodes, curEdges);

        const nextNodes = curNodes.filter(n => !selectedIds.has(String(n.id)));

        const nextEdges = curEdges.filter(e =>
            !selectedIds.has(String(e.source)) &&
            !selectedIds.has(String(e.target)) &&
            !e.selected
        );

        setNodes(nextNodes);
        setEdges(nextEdges);

        queueMicrotask(() => persistOverlay(nextNodes, nextEdges));
    }, [commitHistory, persistOverlay, setNodes, setEdges]);


    // --- NO HOOKS here (important) ---
    const getTargetId = () => {
        if (ctxMenu?.scope === "node" && ctxMenu?.nodeId) return String(ctxMenu.nodeId);
        // pane menu should target selection only (not active execution node)
        if (selectedNodeId) return String(selectedNodeId);
        return null;
    };

    const isProtectedNodeId = (id) => {
        const sid = String(id);

        // block ACTIVE node
        if (activeNodeId != null && String(activeNodeId) === sid) return true;

        // block DONE/COMPLETED node
        if (completedSet.has(sid)) return true;

        return false;
    };

    const copySelection = useCallback(async () => {
        const curNodes = nodesRef.current || [];
        const curEdges = edgesRef.current || [];

        // prefer multi-select in ReactFlow
        const selected = curNodes.filter((n) => n.selected);

        // if nothing selected, fallback to right-click target / selectedNodeId
        const fallbackId = getTargetId();
        const fallbackNode = fallbackId
            ? curNodes.find((n) => String(n.id) === String(fallbackId))
            : null;

        const toCopyNodes = (selected.length ? selected : fallbackNode ? [fallbackNode] : [])
            .filter((n) => !isProtectedNodeId(n.id));

        if (!toCopyNodes.length) return;

        const ids = new Set(toCopyNodes.map((n) => String(n.id)));
        const toCopyEdges = curEdges.filter(
            (e) => ids.has(String(e.source)) && ids.has(String(e.target))
        );

        // store minimal data
        const payload = {
            __wfclip: true,
            version: 1,
            nodes: toCopyNodes.map((n) => ({
                ...n,
                selected: false,
                dragging: false,
            })),
            edges: toCopyEdges.map((e) => ({
                ...e,
                selected: false,
            })),
        };

        clipboardRef.current = payload;

        // best-effort system clipboard
        try {
            await navigator.clipboard.writeText(JSON.stringify(payload));
        } catch {}
    }, [ctxMenu, selectedNodeId, activeNodeId, completedSet]);

    const pasteClipboard = useCallback(async () => {
        // block paste if right-clicked on protected node
        const targetId = getTargetId();
        if (targetId && isProtectedNodeId(targetId)) return;

        let clip = clipboardRef.current;

        // use system clipboard only if internal is empty (faster)
        if (!clip) {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    const parsed = JSON.parse(text);
                    if (parsed && parsed.__wfclip && Array.isArray(parsed.nodes)) {
                        clip = parsed;
                    }
                }
            } catch {}
        }

        if (!clip || !clip.nodes?.length) return;

        const curNodes = nodesRef.current || [];
        const curEdges = edgesRef.current || [];

        // don't paste protected nodes even if somehow in clipboard
        const baseNodes = (clip.nodes || []).filter((n) => !isProtectedNodeId(n.id));
        if (!baseNodes.length) return;

        commitHistory(curNodes, curEdges);

        // where to paste: near mouse
        const pastePos = screenToFlowPosition({
            x: mouseRef.current.x || 200,
            y: mouseRef.current.y || 200,
        });

        // compute bounding box of copied nodes
        const xs = baseNodes.map((n) => n.position?.x || 0);
        const ys = baseNodes.map((n) => n.position?.y || 0);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);

        const idMap = new Map();
        const newNodes = baseNodes.map((n) => {
            const newId = safeUUID();
            idMap.set(String(n.id), newId);

            return {
                ...n,
                id: newId,
                position: {
                    x: pastePos.x + ((n.position?.x || 0) - minX) + 20,
                    y: pastePos.y + ((n.position?.y || 0) - minY) + 20,
                },
                selected: true,
                dragging: false,
                data: {
                    ...(n.data || {}),
                    __exec: { ...(n.data?.__exec || {}), isSelected: true },
                },
            };
        });

        const newEdges = (clip.edges || [])
            .filter((e) => idMap.has(String(e.source)) && idMap.has(String(e.target)))
            .map((e) => ({
                ...e,
                id: safeUUID(),
                source: idMap.get(String(e.source)),
                target: idMap.get(String(e.target)),
                selected: false,
            }));

        // clear existing selection
        const nextNodes = curNodes.map((n) => ({ ...n, selected: false })).concat(newNodes);
        const nextEdges = curEdges.concat(newEdges);

        setNodes(nextNodes);
        setEdges(nextEdges);

        queueMicrotask(() => persistOverlay(nextNodes, nextEdges));
    }, [
        ctxMenu,
        selectedNodeId,
        activeNodeId,
        completedSet,
        commitHistory,
        persistOverlay,
        setNodes,
        setEdges,
        screenToFlowPosition,
    ]);

    const onInit = useCallback((rf) => {
        reactFlowRef.current = rf;
    }, []);

    const onMoveEnd = useCallback(() => {
        persistOverlay(nodesRef.current, edgesRef.current);
    }, [persistOverlay]);

    // ReactFlow change streams (drag, resize, etc.)
    const onNodesChange = useCallback(
        (changes) => {
            setNodes((nds) => {
                const next = applyNodeChanges(changes, nds);

                // notify async to avoid "setState during render" warnings in parents
                queueMicrotask(() => persistOverlay(next, edgesRef.current));

                return next;
            });
        },
        [persistOverlay, setNodes]
    );

    const onEdgesChange = useCallback(
        (changes) => {
            setEdges((eds) => {
                const next = applyEdgeChanges(changes, eds);
                queueMicrotask(() => persistOverlay(nodesRef.current, next));
                return next;
            });
        },
        [persistOverlay, setEdges]
    );

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
                // inside onDrop, after: const tool = JSON.parse(raw);

                const preferred = tool?.backendNodeId ? String(tool.backendNodeId) : null;

// ✅ tools with backendNodeId must be unique + stable
                if (preferred) {
                    const existingNode = (nodesRef.current || []).find((n) => String(n.id) === preferred);
                    if (existingNode) {
                        // already exists -> just select it (no duplicates)
                        setSelectedNodeId(preferred);
                        if (typeof onNodeSelect === "function") onNodeSelect(existingNode);
                        return;
                    }
                }

//  stable id if available, else allow multi-instance generic nodes
                const newNodeId = preferred || safeUUID();
                const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
                const newNode = {
                    id: newNodeId,
                    type: "wf",
                    position,
                    // default size only for creation
                    style: { width: DEFAULT_W, height: DEFAULT_H },
                        data: {
                            label: tool.label,
                            role: tool.role,
                            icon: tool.icon,
                            subtitle: tool.subtitle || "",
                            toolKey: tool.key,
                            kind: tool.kind || "TASK",
                            nodeType: tool.kind || "TASK",

                            // ✅ mark: this node was dropped on canvas (overlay node)
                            __overlay: true,

                            // ✅ default appearance for dropped nodes only
                            ui: {
                                // nice defaults based on kind
                                shape:
                                    String(tool.kind || "").toUpperCase() === "DECISION"
                                        ? "diamond"
                                        : String(tool.kind || "").toUpperCase() === "TIMER"
                                            ? "hex"
                                            : String(tool.kind || "").toUpperCase() === "ACTOR"
                                                ? "pill"
                                                : "rounded",

                                // choose a palette key (you can change these)
                                colorKey:
                                    String(tool.role || "").toUpperCase() === "PATIENT"
                                        ? "blue-600"
                                        : String(tool.role || "").toUpperCase() === "PHYSIO"
                                            ? "emerald-600"
                                            : String(tool.role || "").toUpperCase() === "ADMIN"
                                                ? "amber-500"
                                                : "slate-200",
                            },
                        },
                };

                const prevNodes = nodesRef.current || [];
                const prevEdges = edgesRef.current || [];

                const nextNodes = prevNodes.concat(newNode);
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

                setNodes(nextNodes);
                setEdges(nextEdges);
                setSelectedNodeId(newNodeId);
                onToolDropped?.(newNodeId, tool);

                queueMicrotask(() => persistOverlay(nextNodes, nextEdges));
            } catch (err) {
                console.error("Drop failed:", err);
            }
        },
        [allowDropTools, screenToFlowPosition, selectedNodeId, persistOverlay, setNodes, setEdges]
    );


    const selectSingleNode = useCallback((id) => {
        const sid = String(id);
        setNodes((prev) =>
            (prev || []).map((n) => ({
                ...n,
                selected: String(n.id) === sid,
            }))
        );
        setSelectedNodeId(sid);
    }, [setNodes]);


    const onConnect = useCallback(
        (params) => {
            const curNodes = nodesRef.current || [];
            const curEdges = edgesRef.current || [];

            const sourceNode = curNodes.find((n) => String(n.id) === String(params.source));
            const targetNode = curNodes.find((n) => String(n.id) === String(params.target));
            if (!sourceNode || !targetNode) return;
            if (!canConnect(sourceNode, targetNode)) return;

            const nextEdges = addEdge(
                { ...params, id: `e_${params.source}_${params.target}_${Date.now()}` },
                curEdges
            );

            setEdges(nextEdges);
            queueMicrotask(() => persistOverlay(curNodes, nextEdges));
        },
        [persistOverlay, setEdges]
    );

    const onNodeClick = useCallback(
        (_evt, node) => {
            selectSingleNode(node.id);
            if (typeof onNodeSelect === "function") onNodeSelect(node);
        },
        [selectSingleNode, onNodeSelect]
    );

    // API hook (optional)
    useEffect(() => {
        if (!apiRef) return;

        apiRef.current = {
            addTool: (tool) => {
                // ✅ stable backend id if provided
                const preferred = tool?.backendNodeId ? String(tool.backendNodeId) : null;

                // ✅ avoid duplicates for backend steps
                if (preferred) {
                    const existingNode = (nodesRef.current || []).find((n) => String(n.id) === preferred);
                    if (existingNode) {
                        setSelectedNodeId(preferred);
                        onNodeSelect?.(existingNode);
                        return;
                    }
                }

                const newNodeId = preferred || safeUUID();

                const newNode = {
                    id: newNodeId,
                    type: "wf",
                    position: { x: 120, y: 120 },
                    style: { width: DEFAULT_W, height: DEFAULT_H },
                    data: {
                        label: tool.label,
                        role: tool.role,
                        icon: tool.icon,
                        subtitle: tool.subtitle || "",
                        toolKey: tool.key,
                        kind: tool.kind || "TASK",
                        nodeType: tool.kind || "TASK",
                        __overlay: true,
                    },
                };

                const curNodes = nodesRef.current || [];
                const curEdges = edgesRef.current || [];

                const nextNodes = curNodes.concat(newNode);

                setNodes(nextNodes);
                setSelectedNodeId(newNodeId);

                // ✅ inform parent
                onToolDropped?.(newNodeId, tool);

                queueMicrotask(() => persistOverlay(nextNodes, curEdges));
            },
            // Optional: allow parent to set viewport later if needed
            setViewport: (vp) => {
                if (!reactFlowRef.current?.setViewport) return;
                reactFlowRef.current.setViewport(vp, { duration: 0 });
            },
            getViewport: () => reactFlowRef.current?.getViewport?.(),
        };

        return () => {
            apiRef.current = null;
        };
    }, [apiRef, setNodes, persistOverlay, onToolDropped, onNodeSelect]);

    useEffect(() => {
        const onKeyDown = async (e) => {
            // don't hijack shortcuts while typing in inputs
            const t = e.target;
            const tag = t?.tagName?.toLowerCase();
            const isTyping =
                tag === "input" || tag === "textarea" || t?.isContentEditable;
            if (isTyping) return;

            const mod = e.ctrlKey || e.metaKey;

            const code = e.code; // layout-independent
            const key = (e.key || "").toLowerCase();
            const shift = e.shiftKey;

            // Delete
            if (key === "delete" || key === "backspace") {
                e.preventDefault();
                deleteSelection();
                return;
            }

            // Copy (Ctrl/Cmd + C)
            if (mod && (code === "KeyC" || key === "c")) {
                e.preventDefault();
                await copySelection();
                return;
            }

            // Paste (Ctrl/Cmd + V)
            if (mod && (code === "KeyV" || key === "v")) {
                e.preventDefault();
                await pasteClipboard();
                return;
            }

            // Undo (Ctrl/Cmd + Z)
            if (mod && !shift && (code === "KeyZ" || key === "z")) {
                e.preventDefault();
                undo();
                return;
            }

            // Redo (Ctrl/Cmd + Shift + Z OR Ctrl/Cmd + Y)
            if (
                (mod && shift && (code === "KeyZ" || key === "z")) ||
                (mod && (code === "KeyY" || key === "y"))
            ) {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [deleteSelection, copySelection, pasteClipboard, undo, redo]);


    const onPaneContextMenu = useCallback((e) => {
        e.preventDefault();
        // optional: clear selectedNodeId when right-clicking empty pane
        // setNodes((prev) => (prev || []).map((n) => ({ ...n, selected: false })));
        // setSelectedNodeId(null);

        openCtxMenuAt(e.clientX, e.clientY, "pane", null);
    }, [openCtxMenuAt]);

    const onNodeContextMenu = useCallback((e, node) => {
        e.preventDefault();
        selectSingleNode(node.id);
        openCtxMenuAt(e.clientX, e.clientY, "node", String(node.id));
    }, [openCtxMenuAt, selectSingleNode]);




    useEffect(() => {
        if (!ctxMenu.open) return;

        const onKey = (e) => {
            if (e.key === "Escape") closeCtxMenu();
        };

        const onPointerDown = (e) => {
            const el = ctxMenuRef.current;
            if (el && el.contains(e.target)) return; // click inside menu -> do NOT close
            closeCtxMenu();
        };

        window.addEventListener("keydown", onKey);
        window.addEventListener("pointerdown", onPointerDown);

        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("pointerdown", onPointerDown);
        };
    }, [ctxMenu.open, closeCtxMenu]);
// Touch long-press (use pane pointer events + node mouse down fallback)
   // const onPanePointerDown = useCallback((e) => startLongPress(e, "pane", null), [startLongPress]);
    //  const onPanePointerMove = useCallback((e) => moveLongPress(e), [moveLongPress]);
    // const onPanePointerUp = useCallback(() => endLongPress(), [endLongPress]);
    //  const onNodeMouseDown = useCallback((e, node) => {
        // This event can be a pointer event in modern browsers; startLongPress will ignore non-touch anyway.
    //   startLongPress(e, "node", String(node.id));
    //  }, [startLongPress]);
    const menuTargetId = getTargetId();
    const blockCopyPaste = menuTargetId ? isProtectedNodeId(menuTargetId) : false;
    return (
        <div className="wfCanvasShell" onDragOver={onDragOver} onDrop={onDrop}>

            <ReactFlow
                ref={reactFlowRef}
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                connectionLineType={ConnectionLineType.Bezier}
                onInit={onInit}
                onMoveEnd={onMoveEnd}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}

                onPaneContextMenu={onPaneContextMenu}
                onNodeContextMenu={onNodeContextMenu}



                fitView
                proOptions={{ hideAttribution: true }}

                /* ✅ lock behavior */
                nodesDraggable={!locked}
                nodesConnectable={!locked}
                elementsSelectable={!locked}
                panOnDrag={!locked}
                zoomOnScroll={!locked}
                zoomOnPinch={!locked}
                zoomOnDoubleClick={!locked}
                onPaneMouseMove={(e) => {
                    mouseRef.current = { x: e.clientX, y: e.clientY };
                }}
            >
                <Background variant="dots" gap={24} size={1} color="rgba(148,163,184,0.55)" />
                <Controls
                    showZoom={true}
                    showFitView={true}
                    showInteractive={false} // ❌ THIS removes the default lock button
                >
                    <ControlButton
                        onClick={() => setLocked((v) => !v)}
                        title={locked ? "Unlock canvas" : "Lock canvas"}
                        aria-label={locked ? "Unlock canvas" : "Lock canvas"}
                    >
                        {locked ? "🔒" : "🔓"}
                    </ControlButton>
                </Controls>
                <MiniMap
                    nodeColor={(node) => {
                        if (node.data?.__exec?.isActive) return "#22c55e";
                        if (node.data?.__exec?.isCompleted) return "#3b82f6";
                        return "#64748b";
                    }}
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                    maskColor="rgba(0,0,0,0.05)"
                    style={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background: "#ffffff"
                    }}
                />





            </ReactFlow>
            {ctxMenu.open && (
                <div
                    ref={ctxMenuRef}
                    className="wfCtxMenu"
                    style={{ left: ctxMenu.x, top: ctxMenu.y }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <MenuItem
                        label="Copy"
                        shortcut="Ctrl/Cmd+C"
                        disabled={blockCopyPaste}
                        onClick={async () => {
                            await copySelection();
                            closeCtxMenu();
                        }}
                    />

                    <MenuItem
                        label="Paste"
                        shortcut="Ctrl/Cmd+V"
                        disabled={blockCopyPaste}
                        onClick={async () => {
                            await pasteClipboard();
                            closeCtxMenu();
                        }}
                    />

                    <div className="wfCtxSep" />
                    <MenuItem
                        label="Delete"
                        shortcut="Del"
                        danger
                        onClick={() => {
                            deleteSelection();
                            closeCtxMenu();
                        }}
                    />
                    <div className="wfCtxSep" />
                    <MenuItem label="Undo" shortcut="Ctrl/Cmd+Z" onClick={() => { undo(); closeCtxMenu(); }} />
                    <MenuItem label="Redo" shortcut="Ctrl/Cmd+Shift+Z" onClick={() => { redo(); closeCtxMenu(); }} />
                </div>
            )}
        </div>
    );

}


