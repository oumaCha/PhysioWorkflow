import { NodeResizer, useStore, Handle, Position } from "@xyflow/react";
import { useMemo } from "react";

const BASE_W = 240;
const BASE_H = 86;

function fallbackIcon(kindOrRole) {
    const r = String(kindOrRole || "").toUpperCase();
    if (r === "START") return "▶️";
    if (r === "END") return "⏹️";
    if (r === "DECISION") return "🔀";
    if (r === "TASK") return "🧩";
    if (r === "TIMER") return "⏱️";

    if (r === "PHYSIO") return "🩺";
    if (r === "PATIENT") return "🧑‍🦽";
    if (r === "ADMIN") return "📋";
    return "🧩";
}

function roleBadge(role) {
    const r = String(role || "SYSTEM").toUpperCase();
    if (r === "SYSTEM") return "S";
    if (r === "PHYSIO") return "P";
    if (r === "PATIENT") return "P";
    if (r === "ADMIN") return "A";
    return r[0] || "S";
}


function useNodeSize(id) {
    return useStore((s) => {
        const n = s.nodeLookup.get(id);
        const w = n?.width ?? n?.style?.width ?? BASE_W;
        const h = n?.height ?? n?.style?.height ?? BASE_H;
        return { w, h };
    });
}

function pickAccent({ kind, role }) {
    const k = String(kind || "").toUpperCase();
    if (k === "START" || k === "END") return "#3b82f6";
    if (k === "TASK" || k === "TIMER") return "#22c55e";
    if (k === "DECISION") return "#f59e0b";

    const r = String(role || "").toUpperCase();
    if (r === "PHYSIO") return "#22c55e";
    if (r === "PATIENT") return "#3b82f6";
    if (r === "ADMIN") return "#f59e0b";
    return "#64748b";
}

export default function WfNode({ id, data, selected }) {
    const label = data?.label ?? "Node";
    const role = data?.role ?? "SYSTEM";
    const subtitle = data?.subtitle ?? "";
    const kind = data?.kind ?? data?.nodeType ?? "TASK";
    const icon = data?.icon || fallbackIcon(kind || role);

    const { w, h } = useNodeSize(id);

    // ✅ IMPORTANT: never scale above 1 (prevents huge text)
    const scale = useMemo(() => Math.min(1, Math.min(w / BASE_W, h / BASE_H)), [w, h]);
    const offsetX = useMemo(() => (w - BASE_W * scale) / 2, [w, scale]);
    const offsetY = useMemo(() => (h - BASE_H * scale) / 2, [h, scale]);

    const accent = pickAccent({ kind, role });

    const exec = data?.__exec || {};
    const isActive = !!exec.isActive;
    const isCompleted = !!exec.isCompleted;
    const isSelected = !!exec.isSelected || !!selected;

    const ring = isActive
        ? "0 0 0 6px rgba(59,130,246,0.16)"
        : isCompleted
            ? "0 0 0 6px rgba(34,197,94,0.16)"
            : isSelected
                ? "0 0 0 6px rgba(16,185,129,0.14)"
                : "none";

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    border: "2px solid white",
                    background: "rgba(100,116,139,0.85)",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
                }}
            />

            <Handle
                type="source"
                position={Position.Right}
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    border: "2px solid white",
                    background: "rgba(100,116,139,0.85)",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
                }}
            />

            <NodeResizer
                isVisible={isSelected}
                minWidth={120}
                minHeight={70}
                maxWidth={360}
                maxHeight={200}
            />
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 18,
                    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: isSelected ? `0 18px 44px rgba(0,0,0,0.14), ${ring}` : `0 10px 24px rgba(0,0,0,0.08), ${ring}`,
                    overflow: "hidden",
                    borderLeft: `8px solid ${accent}`,
                    position: "relative",
                }}
            >
                <div
                    style={{
                        width: BASE_W,
                        height: BASE_H,
                        transformOrigin: "top left",
                        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                        display: "flex",
                        alignItems: "center",
                        padding: "14px 16px",
                        gap: 12,
                        boxSizing: "border-box",
                    }}
                >
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 999,
                            display: "grid",
                            placeItems: "center",
                            background: "rgba(59,130,246,0.10)",
                            border: "1px solid rgba(15,23,42,0.08)",
                            fontSize: 18,
                            flex: "0 0 auto",
                        }}
                    >
                        {icon}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                            style={{
                                fontWeight: 950,
                                fontSize: 18,
                                lineHeight: 1.05,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {label}
                        </div>

                        <div
                            style={{
                                marginTop: 6,
                                fontSize: 13,
                                opacity: 0.7,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {subtitle || "Drag • Resize • Connect"}
                        </div>
                    </div>

                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 900,
                            padding: "6px 12px",
                            borderRadius: 999,
                            border: "1px solid rgba(15,23,42,0.10)",
                            background: "rgba(148,163,184,0.16)",
                            opacity: 0.95,
                            flex: "0 0 auto",
                        }}
                    >
                        {roleBadge(role)}
                    </div>
                </div>
            </div>
        </div>
    );
}



