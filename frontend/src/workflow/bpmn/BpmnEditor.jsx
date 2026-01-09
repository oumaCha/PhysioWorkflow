import { useEffect, useRef } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

export default function BpmnEditor({ xml, onXmlChange }) {
  const containerRef = useRef(null);
  const modelerRef = useRef(null);

  // Create modeler once
  useEffect(() => {
    if (!containerRef.current) return;

    const modeler = new BpmnModeler({
      container: containerRef.current,
    });
    modelerRef.current = modeler;

    return () => {
      modeler.destroy();
      modelerRef.current = null;
    };
  }, []);

  // Import XML whenever xml changes
  useEffect(() => {
    async function load() {
      if (!modelerRef.current) return;
      try {
        await modelerRef.current.importXML(xml);
        const canvas = modelerRef.current.get("canvas");
        canvas.zoom("fit-viewport");
      } catch (e) {
        console.error("Failed to import BPMN XML", e);
      }
    }
    if (xml) load();
  }, [xml]);

  async function applyChanges() {
    if (!modelerRef.current) return;
    const { xml: newXml } = await modelerRef.current.saveXML({ format: true });
    onXmlChange(newXml);
  }

  async function downloadXml() {
    if (!modelerRef.current) return;
    const { xml: newXml } = await modelerRef.current.saveXML({ format: true });
    const blob = new Blob([newXml], { type: "application/xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "physioflow.bpmn";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div style={panel}>
      <div style={panelHeader}>
        <div>
          <div style={{ fontWeight: 900 }}>Expert BPMN Mode</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>
            Drag shapes, connect arrows, then click “Apply changes”.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={applyChanges} style={btn}>
            Apply changes
          </button>
          <button onClick={downloadXml} style={btnAlt}>
            Export .bpmn
          </button>
        </div>
      </div>

      <div ref={containerRef} style={{ height: 560, width: "100%" }} />
    </div>
  );
}

const panel = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  overflow: "hidden",
  background: "white",
  boxShadow: "0 6px 22px rgba(0,0,0,0.06)",
};

const panelHeader = {
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  background: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
};

const btn = {
  background: "#0f766e",
  color: "white",
  border: "none",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 900,
  cursor: "pointer",
};

const btnAlt = {
  background: "white",
  color: "#0f172a",
  border: "1px solid #e5e7eb",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 900,
  cursor: "pointer",
};
