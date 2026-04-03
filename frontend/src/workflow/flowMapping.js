// src/workflow/flowMapping.js

// Convert toolbox/canvas "kind" to backend node.type
export function kindToBackendType(kind) {
    const k = String(kind || "TASK").toUpperCase();
    if (k === "DECISION") return "XOR";
    if (k === "START") return "START";
    if (k === "END") return "END";
    if (k === "TIMER") return "TIMER";
    if (k === "ACTOR") return "ACTOR"; // if you keep actors in definition; otherwise ignore
    return "TASK";
}

// Convert backend node.type back to canvas "kind"
export function backendTypeToKind(type) {
    const t = String(type || "TASK").toUpperCase();
    if (t === "XOR") return "DECISION";
    return t; // START, END, TASK, TIMER...
}

// Canvas nodes/edges -> backend {nodes,edges}
export function canvasToBackendDefinition(canvasNodes, canvasEdges, meta) {
    const nodes = (canvasNodes || []).map((n) => {
        const d = n.data || {};
        const backendType = kindToBackendType(d.kind || d.nodeType);

        return {
            id: String(n.id),                 // IMPORTANT: must be stable (t_... / x_...)
            type: backendType,                // TASK / XOR / START / END
            name: d.label ?? null,
            actorRole: d.role ?? null,        // ADMIN/PHYSIO/PATIENT
            contextKey: d.contextKey ?? null, // add this in UI later
            form: d.form ?? null              // add this in UI later
        };
    });

    const edges = (canvasEdges || []).map((e) => ({
        from: String(e.source),
        to: String(e.target),
        condition: e.data?.condition ?? null
    }));

    return {
        meta: meta ?? {},
        nodes,
        edges
    };
}

// Backend {nodes,edges} -> canvas nodes/edges
export function backendDefinitionToCanvas(def) {
    const nodes = (def?.nodes || []).map((n) => ({
        id: String(n.id),
        type: "wf",
        position: n.ui?.position ?? { x: 120, y: 120 }, // if backend stores UI; else default
        style: n.ui?.style ?? { width: 240, height: 86 },
        data: {
            label: n.name ?? n.id,
            role: n.actorRole ?? "SYSTEM",
            kind: backendTypeToKind(n.type),
            contextKey: n.contextKey ?? null,
            form: n.form ?? null
        }
    }));

    const edges = (def?.edges || []).map((e) => ({
        id: `e_${e.from}_${e.to}`,
        source: String(e.from),
        target: String(e.to),
        type: "bezier",
        data: { condition: e.condition ?? null }
    }));

    return { nodes, edges };
}