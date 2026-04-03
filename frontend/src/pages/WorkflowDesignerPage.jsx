import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ExecutableFlowCanvas from "../workflow/canvas/ExecutableFlowCanvas";
import Toolbox from "../workflow/canvas/Toolbox";
import TaskFormModal from "../components/TaskFormModal";
import { backendDefinitionToCanvas, canvasToBackendDefinition } from "../workflow/flowMapping";

async function apiJson(url, opts = {}) {
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
        ...opts,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export default function WorkflowDesignerPage({ workflowKey }) {
    const [def, setDef] = useState(null);
    const [canvas, setCanvas] = useState({ nodes: [], edges: [], viewport: null });

    // --- Test Run state ---
    const [testInstance, setTestInstance] = useState(null);
    const [testTasks, setTestTasks] = useState([]);
    const [testErr, setTestErr] = useState("");

    // modal for completing active task
    const [taskDetails, setTaskDetails] = useState(null);
    const [taskLoading, setTaskLoading] = useState(false);
    const [taskError, setTaskError] = useState("");

    // optional: allow toolbox click-to-add via canvas apiRef (drag/drop already works)
    const canvasApiRef = useRef(null);

    const activeTask = useMemo(
        () => (testTasks || []).find((t) => String(t?.status || "").toUpperCase() === "OPEN"),
        [testTasks]
    );
    const activeNodeId = activeTask?.nodeId || null;

    // 1) Load workflow definition from backend
    useEffect(() => {
        async function load() {
            const data = await apiJson(`/api/workflow-definitions/${workflowKey}`);
            setDef(data);

            // IMPORTANT: your GET returns WorkflowDefinitionEntity, definition JSON is inside:
            // data.definitionJson
            const defJson = data.definitionJson ?? data;
            const { nodes, edges } = backendDefinitionToCanvas(defJson);

            setCanvas((c) => ({ ...c, nodes, edges }));
        }
        load().catch((e) => alert("Load failed: " + String(e?.message || e)));
    }, [workflowKey]);

    // 2) Called whenever user edits graph
    const onGraphChange = useCallback((nextNodes, nextEdges, viewport) => {
        setCanvas({ nodes: nextNodes, edges: nextEdges, viewport });
    }, []);

    // 3) Save button: send backend JSON
    const onSave = useCallback(async () => {
        setTestErr("");
        try {
            const definitionJson = canvasToBackendDefinition(canvas.nodes, canvas.edges, def?.definitionJson?.meta ?? def?.meta);

            // ✅ Backend expects CreateWorkflowDefinitionRequest = { name, definitionJson }
            await apiJson(`/api/workflow-definitions/${workflowKey}`, {
                method: "PUT",
                body: JSON.stringify({
                    name: def?.name ?? def?.definitionJson?.meta?.name ?? def?.meta?.name ?? "Workflow",
                    definitionJson,
                }),
            });

            alert("Saved!");
        } catch (e) {
            alert("Save failed: " + String(e?.message || e));
        }
    }, [canvas.nodes, canvas.edges, def, workflowKey]);

    async function refreshTestRun(instanceIdOverride) {
        const id = instanceIdOverride ?? testInstance?.id;
        if (!id) return;

        const tasks = await apiJson(`/api/workflow-instances/${id}/tasks`);
        setTestTasks(Array.isArray(tasks) ? tasks : []);
    }

    async function startTestRun() {
        setTestErr("");
        try {
            // Deploy latest definition
            const dep = await apiJson(`/api/workflow-definitions/${workflowKey}/deploy`, { method: "POST" });

            // Start instance
            const inst = await apiJson(`/api/workflow-instances`, {
                method: "POST",
                body: JSON.stringify({
                    deploymentId: dep.id,
                    businessKey: `TEST_${workflowKey}_${Date.now()}`,
                }),
            });

            setTestInstance(inst);

            // Fetch tasks for that instance
            await refreshTestRun(inst.id);
        } catch (e) {
            setTestErr(String(e?.message || e));
        }
    }

    async function openCompleteForActive() {
        if (!activeTask?.id) return;
        setTaskError("");
        setTaskLoading(true);
        try {
            const full = await apiJson(`/api/tasks/${activeTask.id}`);
            setTaskDetails(full);
        } catch (e) {
            setTaskError(String(e?.message || e));
        } finally {
            setTaskLoading(false);
        }
    }

    async function submitTask(values) {
        if (!taskDetails?.id) return;
        setTaskError("");
        try {
            // ✅ VERY IMPORTANT: your backend expects { data: {...} } (CompleteTaskRequest)
            await apiJson(`/api/tasks/${taskDetails.id}/complete`, {
                method: "POST",
                body: JSON.stringify({ data: values }),
            });

            setTaskDetails(null);
            await refreshTestRun();
        } catch (e) {
            setTaskError(String(e?.message || e));
        }
    }

    return (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", height: "100vh" }}>
            {/* ✅ Designer toolbox */}
            <Toolbox onAdd={(tool) => canvasApiRef.current?.addTool?.(tool)} />

            <div style={{ display: "grid", gridTemplateRows: "auto auto 1fr", height: "100vh" }}>
                <div style={{ padding: 12, borderBottom: "1px solid #e2e8f0", display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={onSave}>Save workflow definition</button>

                    <button onClick={startTestRun}>
                        {testInstance ? "Restart Test Run" : "Start Test Run"}
                    </button>

                    <button onClick={openCompleteForActive} disabled={!activeTask?.id}>
                        Complete Active Task
                    </button>

                    <div style={{ marginLeft: "auto", fontWeight: 700, opacity: 0.85 }}>
                        {testInstance ? `Test #${testInstance.id} • Active: ${activeNodeId || "-"}` : "No test run"}
                    </div>
                </div>

                {testErr ? (
                    <div style={{ padding: 12, color: "crimson", borderBottom: "1px solid #e2e8f0" }}>
                        {testErr}
                    </div>
                ) : null}

                <ExecutableFlowCanvas
                    nodes={canvas.nodes}
                    edges={canvas.edges}
                    viewport={canvas.viewport}
                    onGraphChange={onGraphChange}
                    allowDropTools={true}         //  Designer = modeling enabled
                    apiRef={canvasApiRef}         //  enables click-to-add from toolbox too
                    activeNodeId={activeNodeId}   //  highlight current step (your canvas already supports this)
                    tasks={testTasks}             //  show completed/open badges (already supported)
                />

                <TaskFormModal
                    open={!!taskDetails}
                    task={taskDetails}
                    loading={taskLoading}
                    error={taskError}
                    onClose={() => setTaskDetails(null)}
                    onSubmit={submitTask}
                />


            </div>
        </div>
    );
}