import { MarkerType } from "@xyflow/react";

function normType(t) {
    return String(t || "").trim().toUpperCase();
}

function layoutGrid(count) {
    const positions = [];
    for (let i = 0; i < count; i++) {
        positions.push({
            x: 60 + (i % 4) * 240,
            y: 60 + Math.floor(i / 4) * 140,
        });
    }
    return positions;
}

export function definitionToFlow(defJson, defaultStyle = { width: 170, height: 78 }) {
    const defNodes = Array.isArray(defJson?.nodes) ? defJson.nodes : [];
    const defEdges = Array.isArray(defJson?.edges) ? defJson.edges : [];

    const positions = layoutGrid(defNodes.length);

    const nodes = defNodes.map((n, idx) => ({
        id: String(n.id),
        type: "wf",
        position: positions[idx],
        style: { ...defaultStyle }, // ✅ IMPORTANT
        data: {
            id: n.id,
            wfType: normType(n.type),
            label: n.name ?? n.id,
            role: n.actorRole ?? "SYSTEM",
            subtitle: n.contextKey ? `context: ${n.contextKey}` : "",
            form: n.form ?? null,
        },
    }));

    const edges = defEdges.map((e, idx) => ({
        id: String(e.id ?? `e-${idx}`),
        source: String(e.from),
        target: String(e.to),
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2 },
        label: e.condition ? String(e.condition) : "",
        data: { condition: e.condition ?? null },
    }));

    return { nodes, edges };
}
