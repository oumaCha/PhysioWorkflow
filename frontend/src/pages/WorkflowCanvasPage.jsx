import { useEffect, useMemo, useState } from "react";
import Toolbox from "../workflow/canvas/Toolbox";
import ExecutableFlowCanvas from "../workflow/canvas/ExecutableFlowCanvas";
import TaskFormModal from "../components/TaskFormModal";
import { workflowApi } from "../workflow/api/workflowApi";
import { definitionToFlow } from "../workflow/canvas/definitionToFlow";
import ClinicalNotesDrawer from "../components/ClinicalNotesDrawer";

function safeObj(v) {
    return v && typeof v === "object" ? v : {};
}

function safeArr(v) {
    return Array.isArray(v) ? v : [];
}

export default function WorkflowCanvasPage({ auth, instanceId, taskId, onBackToDashboard }) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [layout, setLayout] = useState({});
    const [layoutDirty, setLayoutDirty] = useState(false);

    const [tasks, setTasks] = useState([]);
    const [baseNodes, setBaseNodes] = useState([]);
    const [baseEdges, setBaseEdges] = useState([]);

    const [overlayNodes, setOverlayNodes] = useState([]);
    const [overlayEdges, setOverlayEdges] = useState([]);
    const [overlayDirty, setOverlayDirty] = useState(false);

    const [notesByNodeId, setNotesByNodeId] = useState({});
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);

    const [taskDetails, setTaskDetails] = useState(null);
    const [taskLoading, setTaskLoading] = useState(false);
    const [taskErr, setTaskErr] = useState("");
    const [savingTask, setSavingTask] = useState(false);
    const [savingAll, setSavingAll] = useState(false);

    const activeTask = useMemo(() => tasks.find((t) => t.status === "OPEN"), [tasks]);

    const mergedNodes = useMemo(() => {
        const base = safeArr(baseNodes);
        const overlay = safeArr(overlayNodes);
        const baseIds = new Set(base.map((n) => String(n.id)));
        const filteredOverlay = overlay.filter((n) => !baseIds.has(String(n.id)));
        return base.concat(filteredOverlay);
    }, [baseNodes, overlayNodes]);

    const decoratedNodes = useMemo(() => {
        const notes = notesByNodeId || {};
        return (mergedNodes || []).map((n) => {
            const id = String(n.id);
            const noteText = typeof notes[id] === "string" ? notes[id].trim() : "";
            const hasNotes = noteText.length > 0;

            return {
                ...n,
                data: {
                    ...(n.data || {}),
                    hasNotes,
                    notePreview: hasNotes ? noteText.slice(0, 140) : "",
                },
            };
        });
    }, [mergedNodes, notesByNodeId]);


    const mergedEdges = useMemo(() => {
        const base = safeArr(baseEdges);
        const overlay = safeArr(overlayEdges);
        const baseIds = new Set(base.map((e) => String(e.id)));
        const filteredOverlay = overlay.filter((e) => !baseIds.has(String(e.id)));
        return base.concat(filteredOverlay);
    }, [baseEdges, overlayEdges]);

    const refresh = async () => {
        if (!instanceId) return;
        setLoading(true);
        setErr("");

        try {
            const inst = await workflowApi.getInstance(instanceId, auth);
            const defId = inst?.definitionId;

            const def = await workflowApi.getDefinition(defId, auth);
            const flow = definitionToFlow(def.definitionJson, { width: 110, height: 52 });

            setBaseNodes(safeArr(flow.nodes));
            setBaseEdges(safeArr(flow.edges));

            const t = await workflowApi.listInstanceTasks(instanceId, auth);
            setTasks(safeArr(t));

            const l = await workflowApi.getLayout(instanceId, auth);
            setLayout(safeObj(l));
            setLayoutDirty(false);

            const ov = await workflowApi.getOverlay(instanceId, auth);
            setOverlayNodes(safeArr(ov?.nodes));
            setOverlayEdges(safeArr(ov?.edges));
            setNotesByNodeId(ov?.notes && typeof ov.notes === "object" ? ov.notes : {});
            setOverlayDirty(false);
        } catch (e) {
            setErr(String(e?.message || e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, [instanceId]);

    const handleLayoutChange = (newLayout) => {
        setLayout(newLayout);
        setLayoutDirty(true);
    };

    const handleGraphChange = (allNodes, allEdges) => {
        const baseIdSet = new Set(safeArr(baseNodes).map((n) => String(n.id)));

        const ovNodes = safeArr(allNodes).filter((n) => !baseIdSet.has(String(n.id)));
        const ovEdges = safeArr(allEdges).filter((e) => {
            const srcOverlay = !baseIdSet.has(String(e.source));
            const tgtOverlay = !baseIdSet.has(String(e.target));
            return srcOverlay || tgtOverlay;
        });

        setOverlayNodes(ovNodes);
        setOverlayEdges(ovEdges);
        setOverlayDirty(true);
    };

    const saveAll = async () => {
        if (!instanceId) return;
        setSavingAll(true);
        setErr("");

        try {
            await workflowApi.saveLayout(instanceId, layout, auth);

            await workflowApi.saveOverlay(
                instanceId,
                {
                    nodes: overlayNodes,
                    edges: overlayEdges,
                    notes: notesByNodeId,
                },
                auth
            );

            setLayoutDirty(false);
            setOverlayDirty(false);
        } catch (e) {
            setErr(String(e?.message || e));
        } finally {
            setSavingAll(false);
        }
    };

    const dirty = layoutDirty || overlayDirty;

    return (
        <div style={{ display: "flex", height: "78vh", background: "#fff" }}>
            <Toolbox />

            <div style={{ flex: 1, position: "relative" }}>
                <div style={{ padding: 10, display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 950 }}>
                        Instance #{instanceId}
                        {activeTask?.nodeId && <span style={{ opacity: 0.6 }}> • active: {activeTask.nodeId}</span>}
                        {dirty && <span style={{ marginLeft: 10, opacity: 0.65 }}>• unsaved changes</span>}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={onBackToDashboard}>Back</button>
                        <button onClick={saveAll} disabled={savingAll}>
                            {savingAll ? "Saving…" : "Save"}
                        </button>
                        <button onClick={refresh} disabled={loading}>
                            {loading ? "Loading…" : "Refresh"}
                        </button>
                    </div>
                </div>

                {err && <div style={{ color: "red", padding: 10 }}>{err}</div>}

                <ExecutableFlowCanvas
                    nodes={decoratedNodes}
                    edges={mergedEdges}
                    layout={layout}
                    tasks={tasks}
                    activeNodeId={activeTask?.nodeId}
                    onLayoutChange={handleLayoutChange}
                    onGraphChange={handleGraphChange}
                    onNodeSelect={(node) => {
                        setSelectedNode(node);
                        setDrawerOpen(true);
                    }}
                    allowDropTools={true}
                />
            </div>

            <ClinicalNotesDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                instanceId={instanceId}
                node={selectedNode}
                notesByNodeId={notesByNodeId}
                setNotesByNodeId={setNotesByNodeId}
            />

            <TaskFormModal
                open={!!taskDetails}
                task={taskDetails}
                loading={taskLoading || savingTask}
                error={taskErr}
                onClose={() => setTaskDetails(null)}
                onSubmit={() => {}}
            />
        </div>
    );
}
