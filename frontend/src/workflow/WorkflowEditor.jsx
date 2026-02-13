import FlowCanvas from "./canvas/FlowCanvas";
import Toolbox from "./canvas/Toolbox";

export default function WorkflowEditor() {
    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <Toolbox />
            <div style={{ flex: 1 }}>
                <FlowCanvas />
            </div>
        </div>
    );
}
