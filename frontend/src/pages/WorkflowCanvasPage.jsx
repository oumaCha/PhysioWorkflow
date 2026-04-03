import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Toolbox from "../workflow/canvas/Toolbox";
import ExecutableFlowCanvas from "../workflow/canvas/ExecutableFlowCanvas";
import TaskFormModal from "../components/TaskFormModal";
import { workflowApi } from "../workflow/api/workflowApi";
import { definitionToFlow } from "../workflow/canvas/definitionToFlow";
import ClinicalNotesDrawer from "../components/ClinicalNotesDrawer";
import { apiFetch } from "../workflow/api/http";



function safeObj(v) {
    return v && typeof v === "object" ? v : {};
}

function safeArr(v) {
    return Array.isArray(v) ? v : [];
}


function sanitizeJson(value) {
    return JSON.parse(
        JSON.stringify(value, (_k, v) => {
            if (typeof v === "number" && !Number.isFinite(v)) return 0; // replace NaN/Infinity
            if (v === undefined) return null; // undefined is not valid JSON
            return v;
        })
    );
}

function buildGraph(defJson) {
    const nodes = Array.isArray(defJson?.nodes) ? defJson.nodes : [];
    const edges = Array.isArray(defJson?.edges) ? defJson.edges : [];

    const typeById = new Map(nodes.map(n => [String(n.id), String(n.type || "").toUpperCase()]));
    const out = new Map();

    for (const e of edges) {
        const from = String(e.from);
        const to = String(e.to);
        if (!out.has(from)) out.set(from, []);
        out.get(from).push({ to, condition: e.condition ?? null });
    }
    return { typeById, out };
}


function getSchemaFromDefinition(definitionJson, nodeId) {
    const defNodes = Array.isArray(definitionJson?.nodes) ? definitionJson.nodes : [];
    const n = defNodes.find((x) => String(x.id) === String(nodeId));
    // adjust these keys if your node stores it differently:
    return n?.form || n?.formSchema || n?.data?.formSchema || n?.data?.form || null;
}

// returns NEXT TASK(s) reachable by skipping XOR nodes
function nextTaskCandidates(defJson, startId) {
    if (!defJson || !startId) return [];
    const { typeById, out } = buildGraph(defJson);

    const q = [String(startId)];
    const seen = new Set();
    const res = new Set();

    while (q.length) {
        const cur = q.shift();
        for (const edge of (out.get(cur) || [])) {
            const to = String(edge.to);
            const key = `${cur}->${to}`;
            if (seen.has(key)) continue;
            seen.add(key);

            const t = typeById.get(to) || "TASK";
            if (t === "TASK") res.add(to);
            else if (t !== "END") q.push(to); // XOR etc
        }
    }
    return Array.from(res);
}

export default function WorkflowCanvasPage({ auth, instanceId, onBackToDashboard }) {
    const canvasApiRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [layout, setLayout] = useState({});
    const [layoutDirty, setLayoutDirty] = useState(false);

    const [definitionJson, setDefinitionJson] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [instance, setInstance] = useState(null);
    const [baseNodes, setBaseNodes] = useState([]);
    const [baseEdges, setBaseEdges] = useState([]);

    const [overlayNodes, setOverlayNodes] = useState([]);
    const [overlayEdges, setOverlayEdges] = useState([]);
    const [overlayDirty, setOverlayDirty] = useState(false);


    const [overlayViewport, setOverlayViewport] = useState(null);
    const [nodeSizes, setNodeSizes] = useState({}); // { [nodeId]: { w, h } }


    const [notesByNodeId, setNotesByNodeId] = useState({});
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);

    const [taskDetails, setTaskDetails] = useState(null);
    const [taskLoading, setTaskLoading] = useState(false);
    const [taskErr, setTaskErr] = useState("");
    const [savingTask, setSavingTask] = useState(false);
    const [savingAll, setSavingAll] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const suppressDirtyRef = useRef(false);

    const [executionOrder, setExecutionOrder] = useState([]); // drop order of nodeIds
    const [activeNodeLocal, setActiveNodeLocal] = useState(null); // local active override

    const [uiByNodeId, setUiByNodeId] = useState({}); // { [nodeId]: { shape, colorKey } }
    const [patientInfo, setPatientInfo] = useState(null);


    // put this near your other "active" code
    const activeTask = useMemo(
        () => (tasks || []).find((t) => String(t?.status || "").toUpperCase() === "OPEN"),
        [tasks]
    );

// ✅ backend first, then local override (optional)
    const activeNodeIdEffective =
        instance?.currentNodeId ?? activeTask?.nodeId ?? activeNodeLocal ?? null;


    const nextNodeId = useMemo(() => {
        const cur = activeNodeIdEffective ? String(activeNodeIdEffective) : null;
        if (!cur) return null;

        const idx = executionOrder.indexOf(cur);
        if (idx < 0) return null;

        return executionOrder[idx + 1] ? String(executionOrder[idx + 1]) : null;
    }, [activeNodeIdEffective, executionOrder]);



    const normalizeOverlayNodes = (nodes) => {
        return (nodes || []).map((n) => {
            const kind = String(n?.data?.kind || n?.data?.nodeType || "TASK").toUpperCase();
            const role = String(n?.data?.role || "").toUpperCase();

            const defaultShape =
                kind === "DECISION" ? "diamond" :
                    kind === "TIMER" ? "hex" :
                        kind === "ACTOR" ? "pill" :
                            "rounded";

            const defaultColor =
                role === "PATIENT" ? "blue-600" :
                    role === "PHYSIO" ? "emerald-600" :
                        role === "ADMIN" ? "amber-500" :
                            "slate-200";

            return {
                ...n,
                data: {
                    ...(n.data || {}),

                    // ✅ mark as overlay (important for drawer UI)
                    __overlay: n?.data?.__overlay ?? true,

                    // ✅ ensure ui exists
                    ui: {
                        shape: n?.data?.ui?.shape || defaultShape,
                        colorKey: n?.data?.ui?.colorKey || defaultColor,
                    },
                },
            };
        });
    };

   // active nodes
    const handleToolDropped = useCallback((nodeId, tool) => {
        //  ignore side tools
        if (tool?.nonExecution) return;

        const id = String(nodeId);

        setExecutionOrder((prev) => {
            const arr = Array.isArray(prev) ? prev : [];
            return arr.includes(id) ? arr : [...arr, id];
        });

        setActiveNodeLocal((prev) => prev ?? id);
    }, []);



    const mergedNodes = useMemo(() => {
        const base = safeArr(baseNodes);
        const overlay = safeArr(overlayNodes);
        const baseIds = new Set(base.map((n) => String(n.id)));
        const filteredOverlay = overlay.filter((n) => !baseIds.has(String(n.id)));
        return base.concat(filteredOverlay);
    }, [baseNodes, overlayNodes]);

    useEffect(() => {
        if (loading) return;           // ✅ wait until refresh finished
        if (!definitionJson) return;   // ✅ need definition

        const id = activeNodeIdEffective ? String(activeNodeIdEffective) : null;
        if (!id) return;

        const exists = (mergedNodes || []).some((n) => String(n.id) === id);
        if (exists) return;

        const defNodes = Array.isArray(definitionJson?.nodes) ? definitionJson.nodes : [];
        const defNode = defNodes.find((n) => String(n.id) === id);
        if (!defNode) return;

        if (String(defNode.type || "").toUpperCase() !== "TASK") return;

        setOverlayNodes((prev) => {
            const cur = Array.isArray(prev) ? prev : [];
            if (cur.some((n) => String(n.id) === id)) return cur;

            const x = 320 + cur.length * 28;
            const y = 180 + cur.length * 18;

            return normalizeOverlayNodes([
                ...cur,
                {
                    id,
                    type: "wf",
                    position: { x, y },
                    style: { width: 240, height: 86 },
                    data: {
                        label: defNode.name || id,
                        role: defNode.actorRole || "SYSTEM",
                        kind: "TASK",
                        nodeType: "TASK",
                        __overlay: true,
                    },
                },
            ]);
        });

        setOverlayDirty(true);
    }, [activeNodeIdEffective, mergedNodes, definitionJson, loading]);

    const [followExecution, setFollowExecution] = useState(true);
    const progress = useMemo(() => {
        const total = (baseNodes?.length || 0) + (overlayNodes?.length || 0);
        const completed = (tasks || []).filter(t => t?.status === "COMPLETED").length;
        const open = (tasks || []).filter(t => t?.status === "OPEN").length;
        return { total, completed, open };
    }, [tasks, baseNodes, overlayNodes]);



    const onChangeNodeUi = (nodeId, patch) => {
        const idStr = String(nodeId);

        setUiByNodeId((prev) => {
            const cur = prev?.[idStr] || {};
            return {
                ...(prev || {}),
                [idStr]: { ...cur, ...patch },
            };
        });

        // keep selectedNode drawer in sync instantly
        setSelectedNode((prev) => {
            if (!prev || String(prev.id) !== idStr) return prev;
            const curUi = prev?.data?.ui || {};
            return {
                ...prev,
                data: {
                    ...(prev.data || {}),
                    __overlay: true,
                    ui: { ...curUi, ...patch },
                },
            };
        });

        setOverlayDirty(true);
    };

    const decoratedNodes = useMemo(() => {
        const notes = notesByNodeId || {};
        const uiMap = uiByNodeId || {};

        return (mergedNodes || []).map((n) => {
            const id = String(n.id);

            const noteText = typeof notes[id] === "string" ? notes[id].trim() : "";
            const hasNotes = noteText.length > 0;

            const sz = nodeSizes?.[id];
            const style = { ...(n.style || {}) };
            if (sz && typeof sz.w === "number" && typeof sz.h === "number") {
                style.width = sz.w;
                style.height = sz.h;
            }

            const uiOverride = uiMap[id]; // { shape, colorKey } or undefined

            return {
                ...n,
                style,
                data: {
                    ...(n.data || {}),
                    hasNotes,
                    notePreview: hasNotes ? noteText.slice(0, 140) : "",

                    // ✅ if there is an override, force node to behave like overlay for styling
                    ...(uiOverride
                        ? {
                            __overlay: true,
                            ui: {
                                ...(n.data?.ui || {}),
                                ...uiOverride,
                            },
                        }
                        : {}),
                },
            };
        });
    }, [mergedNodes, notesByNodeId, uiByNodeId, nodeSizes]);






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
            setInstance(inst);

            // Fetch patient for this workflow instance (simple way)
            const allPatients = await apiFetch("/api/physio/patients", { auth });
            const p = (Array.isArray(allPatients) ? allPatients : []).find(
                (x) => String(x?.workflowInstanceId) === String(instanceId)
            );
            setPatientInfo(p || null);

            const defId = inst?.definitionId;

            const def = await workflowApi.getDefinition(defId, auth);
            setDefinitionJson(def.definitionJson);
            const flow = definitionToFlow(def.definitionJson, { width: 110, height: 52 });

            setBaseNodes(safeArr(flow.nodes));
            setBaseEdges(safeArr(flow.edges));

            const t = await workflowApi.listInstanceTasks(instanceId, auth);
            setTasks(safeArr(t));
            console.log(
                "instance",
                instanceId,
                "tasks:",
                safeArr(t).filter(Boolean).map(x => ({ nodeId: x?.nodeId, status: x?.status, id: x?.id }))
            );

            const l = await workflowApi.getLayout(instanceId, auth);
            setLayout(safeObj(l));
            setLayoutDirty(false);

            const ov = await workflowApi.getOverlay(instanceId, auth);

            setOverlayNodes(normalizeOverlayNodes(safeArr(ov?.nodes)));
            setOverlayEdges(safeArr(ov?.edges));

            setNotesByNodeId(ov?.notes && typeof ov.notes === "object" ? ov.notes : {});
            setUiByNodeId(ov?.uiByNodeId && typeof ov.uiByNodeId === "object" ? ov.uiByNodeId : {}); // ✅ add
            setOverlayViewport(ov?.viewport && typeof ov.viewport === "object" ? ov.viewport : null);
            setNodeSizes(ov?.nodeSizes && typeof ov.nodeSizes === "object" ? ov.nodeSizes : {});
            setOverlayDirty(false);

        } catch (e) {
            setErr(String(e?.message || e));
        } finally {
            setLoading(false);
        }
    };

    const isPhysio =
        String(auth?.role ?? auth?.user?.role ?? auth?.user?.actorRole ?? "")
            .toUpperCase()
            .includes("PHYSIO");

    useEffect(() => {
        refresh();
    }, [instanceId]);

    const handleLayoutChange = (newLayout) => {
        if (suppressDirtyRef.current) return;
        setLayout(newLayout);
        setLayoutDirty(true);
    };

    const handleGraphChange = (allNodes, allEdges, viewport) => {
        if (suppressDirtyRef.current) return;
        const baseIdSet = new Set(safeArr(baseNodes).map((n) => String(n.id)));

        // overlay nodes/edges are still only the "new" ones
        const ovNodes = safeArr(allNodes).filter((n) => !baseIdSet.has(String(n.id)));
        const ovEdges = safeArr(allEdges).filter((e) => {
            const srcOverlay = !baseIdSet.has(String(e.source));
            const tgtOverlay = !baseIdSet.has(String(e.target));
            return srcOverlay || tgtOverlay;
        });

        // ✅ capture sizes for ALL nodes (base + overlay)
        const sizes = {};
        for (const n of safeArr(allNodes)) {
            const id = String(n.id);
            const w = n?.style?.width ?? n?.width;
            const h = n?.style?.height ?? n?.height;
            if (typeof w === "number" && typeof h === "number") {
                sizes[id] = { w, h };
            }
        }
        setOverlayNodes(normalizeOverlayNodes(ovNodes));
        setOverlayEdges(ovEdges);
        setNodeSizes(sizes);

        if (viewport && typeof viewport === "object") {
            setOverlayViewport(viewport);
        }

        setOverlayDirty(true);
    };


    const saveAll = async () => {
        if (!instanceId) return;
        setSavingAll(true);
        setErr("");
        setSaveMsg("");

        // prevent late change events (from reactflow) from setting dirty back to true
        suppressDirtyRef.current = true;

        try {
            await apiFetch("/api/auth/csrf").catch(() => {});
            await workflowApi.saveLayout(instanceId, layout, auth);

            await workflowApi.saveOverlay(
                instanceId,
                sanitizeJson({
                       nodes: overlayNodes,
                    edges: overlayEdges,
                    notes: notesByNodeId,
                    uiByNodeId,
                    viewport: overlayViewport,
                    nodeSizes,
                  }),
                auth
            );


            // clear dirty flags
            setLayoutDirty(false);
            setOverlayDirty(false);

            // show success message
            setSaveMsg("✅ Changes saved");

            // auto-hide after 2 seconds
            setTimeout(() => setSaveMsg(""), 2000);
        } catch (e) {
            setErr(String(e?.message || e));
        } finally {
            // allow dirty tracking again AFTER state settles
            setTimeout(() => {
                suppressDirtyRef.current = false;
            }, 300);

            setSavingAll(false);
        }
    };


    const dirty = layoutDirty || overlayDirty;

    return (
        <div className="wfEditorRoot">
            <Toolbox
                onAdd={(tool) => {
                    canvasApiRef.current?.addTool?.(tool);
                }}
            />

            <div className="wfEditorMain">
                <div style={{padding: 10, display: "flex", justifyContent: "space-between"}}>
                    <div style={{fontWeight: 950}}>
                        {(patientInfo?.fullName || patientInfo?.name) && (
                            <span>{patientInfo.fullName || patientInfo.name}</span>
                        )}
                        {(patientInfo?.treatmentArea ?? patientInfo?.treatmentType ?? patientInfo?.treatment) && (
                            <span style={{ opacity: 0.75 }}>
    {" "} • {patientInfo.treatmentArea ?? patientInfo.treatmentType ?? patientInfo.treatment}
  </span>
                        )}
                        <span style={{opacity: 0.6}}>
                          {" "} • Instance #{instanceId}
                        </span>

                        {activeNodeIdEffective && (
                            <span style={{opacity: 0.6}}> • active: {activeNodeIdEffective}</span>
                        )}
                        {dirty && <span style={{marginLeft: 10, opacity: 0.65}}>• unsaved changes</span>}
                        {saveMsg && <span style={{marginLeft: 10, color: "#16a34a"}}>{saveMsg}</span>}
                    </div>


                    <div className="wfToolbar">
                        <button className="wfBtn wfBtnGhost" onClick={onBackToDashboard}>
                            <span className="wfBtnIcon">←</span>
                            <span className="wfBtnText">Back</span>
                        </button>

                        <button
                            className="wfBtn wfBtnPrimary"
                            onClick={saveAll}
                            disabled={savingAll || !dirty}
                        >
                            <span className="wfBtnIcon">{savingAll ? "⏳" : "💾"}</span>
                            <span className="wfBtnText">
      {savingAll ? "Saving…" : dirty ? "Save changes" : "Saved"}
    </span>
                        </button>

                        <button className="wfBtn" onClick={refresh} disabled={loading}>
                            <span className="wfBtnIcon">{loading ? "⏳" : "⟳"}</span>
                            <span className="wfBtnText">{loading ? "Loading…" : "Refresh"}</span>
                        </button>

                        <button
                            className="wfBtn"
                            onClick={() => setFollowExecution(v => !v)}
                            title="Follow active step"
                        >
                            <span className="wfBtnIcon">{followExecution ? "🎯" : "👁️"}</span>
                            <span className="wfBtnText">{followExecution ? "Following" : "Follow"}</span>
                        </button>


                    </div>


                </div>

                {err && <div style={{color: "red", padding: 10}}>{err}</div>}

                <ExecutableFlowCanvas
                    nodes={decoratedNodes}
                    edges={mergedEdges}
                    layout={layout}
                    viewport={overlayViewport}
                    tasks={tasks}

                    activeNodeId={activeNodeIdEffective}
                    focusNodeId={followExecution ? activeNodeIdEffective : null}
                    onToolDropped={handleToolDropped}
                    onLayoutChange={handleLayoutChange}
                    onGraphChange={handleGraphChange}

                    onNodeSelect={async (node) => {
                        setSelectedNode(node);
                        setDrawerOpen(true);

                        const nodeId = String(node.id);

                        // ✅ Map: clicking a DECISION should open a specific TASK popup
                        const decisionToTaskNodeId = {
                            x_pain_first_consult: "t_pain_first_consult",
                            x_pain_outcome: "t_pain_outcome",
                        };

                        const openTask = async (t) => {
                            setTaskLoading(true);
                            setTaskErr("");
                            try {
                                const full = await workflowApi.getTask(t.id, auth);

                                const nodeId = String(full?.nodeId ?? t?.nodeId ?? "");

// try definition schema first
                                let schemaFromDef = getSchemaFromDefinition(definitionJson, nodeId);

//  fallback schema (NO backend JSON change)
                                if (!schemaFromDef && nodeId === "t_pain_first_consult") {
                                    schemaFromDef = {
                                        title: "Choose pain level",
                                        fields: [
                                            {
                                                key: "painLevel",
                                                label: "Pain level",
                                                type: "select",
                                                options: ["LOW", "HIGH"],
                                                required: true,
                                            },
                                        ],
                                    };
                                }

                                if (!schemaFromDef && nodeId === "t_pain_outcome") {
                                    schemaFromDef = {
                                        title: "Choose pain level",
                                        fields: [
                                            {
                                                key: "painLevel",
                                                label: "Pain level",
                                                type: "select",
                                                options: ["LOW", "HIGH"],
                                                required: true,
                                            },
                                        ],
                                    };
                                }

                                setTaskDetails({
                                    ...full,
                                    formSchema: schemaFromDef || full?.formSchema || null,
                                });
                            } catch (e) {
                                setTaskErr(String(e?.message || e));
                                setTaskDetails(t);
                            } finally {
                                setTaskLoading(false);
                            }
                        };

                        // ✅ If user clicked a DECISION node, redirect to its input TASK
                        const wfType = String(node?.data?.wfType || "").toUpperCase();

                        if (wfType === "DECISION" && decisionToTaskNodeId[nodeId]) {
                            const targetTaskNodeId = decisionToTaskNodeId[nodeId];

                            //  ONLY allow decision-click → popup when the target pain TASK is the ACTIVE node
                            const activeOk =
                                activeNodeIdEffective != null &&
                                String(activeNodeIdEffective) === String(targetTaskNodeId);

                            if (!activeOk) return; // behave like other nodes: no popup if not active

                            const taskForTarget = (tasks || []).find((t) => {
                                const status = String(t?.status || "").toUpperCase();
                                const sameNode = String(t?.nodeId) === String(targetTaskNodeId);
                                const actionable = status !== "COMPLETED" && status !== "CANCELLED";
                                return sameNode && actionable;
                            });

                            if (taskForTarget) {
                                await openTask(taskForTarget);
                            }
                            return;
                        }

                        // ✅ Normal behavior (your existing logic)
                        const taskForNode = (tasks || []).find((t) => {
                            const status = String(t?.status || "").toUpperCase();
                            const sameNode = String(t?.nodeId) === nodeId;
                            const actionable = status !== "COMPLETED" && status !== "CANCELLED";
                            return sameNode && actionable;
                        });

                        if (taskForNode) {
                            await openTask(taskForNode);
                            return;
                        }

                        const clickedIsActive =
                            activeNodeIdEffective != null && String(activeNodeIdEffective) === nodeId;

                        if (clickedIsActive && activeTask) {
                            await openTask(activeTask);
                        }
                    }}
                    apiRef={canvasApiRef}
                    allowDropTools={isPhysio}

                />
            </div>
            <div style={{opacity: 0.6}}>role: {String(auth?.role ?? auth?.user?.role ?? "")}</div>

            <ClinicalNotesDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                instanceId={instanceId}
                node={selectedNode}
                tasks={tasks}                          //  ADD
                activeNodeId={activeNodeIdEffective}
                notesByNodeId={notesByNodeId}
                setNotesByNodeId={setNotesByNodeId}
                onChangeNodeUi={onChangeNodeUi}
            />

            <TaskFormModal
                open={!!taskDetails}
                task={taskDetails}
                loading={taskLoading || savingTask}
                error={taskErr}
                onClose={() => setTaskDetails(null)}
                onSubmit={async (values) => {
                    if (!taskDetails?.id) return;

                    setSavingTask(true);
                    setTaskErr("");

                    try {
                        const completedNodeId = String(taskDetails.nodeId);

                        await workflowApi.completeTask(taskDetails.id, values, auth);
                        setTaskDetails(null);
                        await refresh();
                        setActiveNodeLocal(null);

                    } catch (e) {
                        setTaskErr(String(e?.message || e));
                    } finally {
                        setSavingTask(false);
                    }
                }}
            />
        </div>
    );
}
