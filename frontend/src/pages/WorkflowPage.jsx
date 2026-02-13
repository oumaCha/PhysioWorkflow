import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getTasks, getWorkflowTemplate, getLayout, saveLayout } from "../workflow/api/workflowApi";
import WorkflowCanvas from "../components/canvas/WorkflowCanvas";
import TaskFormModal from "../components/TaskFormModal";

export default function WorkflowPage() {
    const { instanceId } = useParams();

    const [template, setTemplate] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [layout, setLayout] = useState({});

    useEffect(() => {
        async function load() {
            const tpl = await getWorkflowTemplate(instanceId);
            const t = await getTasks(instanceId);
            const l = await getLayout(instanceId);

            setTemplate(tpl);
            setTasks(t);
            setLayout(l);
        }

        load();
    }, [instanceId]);

    // ✅ derive activeTask from tasks (so tasks is actually used)
    const activeTask = useMemo(
        () => tasks.find(task => task.status === "OPEN"),
        [tasks]
    );

    async function handleSaveLayout(newLayout) {
        setLayout(newLayout);
        await saveLayout(instanceId, newLayout);
    }

    if (!template) return <div>Loading workflow...</div>;

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <WorkflowCanvas
                nodes={template.nodes}
                edges={template.edges}
                layout={layout}
                activeNodeId={activeTask?.nodeId}
                tasks={tasks} // 👈 now tasks is also passed to canvas (important later)
                onLayoutChange={handleSaveLayout}
            />

            {activeTask && (
                <TaskFormModal
                    open={true}
                    task={activeTask}
                    onClose={() => {}}
                    onSubmit={() => window.location.reload()}
                />
            )}
        </div>
    );
}
