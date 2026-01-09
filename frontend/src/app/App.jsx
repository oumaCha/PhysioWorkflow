import { useState } from "react";
import AppLayout from "../layout/AppLayout";
import WorkflowCanvasPage from "../pages/WorkflowCanvasPage";

// Later you can add more pages:
// import SimpleBuilderPage from "../pages/SimpleBuilderPage";
// import BpmnExpertPage from "../pages/BpmnExpertPage";

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "white" : "rgba(255,255,255,0.18)",
        color: active ? "#0f172a" : "white",
        border: active ? "none" : "1px solid rgba(255,255,255,0.35)",
        padding: "10px 14px",
        borderRadius: 12,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function App() {
  // App-level navigation state
  const [tab, setTab] = useState("canvas"); // "canvas" | "simple" | "bpmn"

  // Header changes depending on which tab is active
  const headerTitle = "PhysioFlow — Workflow Modeling";
  const headerSubtitle =
    tab === "canvas"
      ? "Professional workflow canvas (tablet-friendly)"
      : tab === "simple"
      ? "Simple Builder (clinician-friendly)"
      : "Expert BPMN Editor";

  const headerRight = (
    <>
      <TabButton active={tab === "canvas"} onClick={() => setTab("canvas")}>
        Canvas
      </TabButton>

      {/* enable later when you create these pages */}
      {/* <TabButton active={tab === "simple"} onClick={() => setTab("simple")}>
        Simple
      </TabButton>

      <TabButton active={tab === "bpmn"} onClick={() => setTab("bpmn")}>
        BPMN
      </TabButton> */}
    </>
  );

  return (
    <AppLayout
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
      headerRight={headerRight}
    >
      {tab === "canvas" && <WorkflowCanvasPage />}

      {/* enable later */}
      {/* {tab === "simple" && <SimpleBuilderPage />} */}
      {/* {tab === "bpmn" && <BpmnExpertPage />} */}
    </AppLayout>
  );
}
