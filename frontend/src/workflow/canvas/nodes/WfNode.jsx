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

// badge text
function roleBadge(role) {
    const r = String(role || "SYSTEM").toUpperCase();
    if (r === "SYSTEM") return "S";
    if (r === "PHYSIO") return "P";
    if (r === "PATIENT") return "P";
    if (r === "ADMIN") return "A";
    return r[0] || "S";
}

// read live size from ReactFlow store
// read live size from ReactFlow store
function useNodeSize(id) {
    return useStore((s) => {
        const n = s.nodeLookup.get(id);

        const w =
            typeof n?.width === "number"
                ? n.width
                : typeof n?.style?.width === "number"
                    ? n.style.width
                    : BASE_W;

        const h =
            typeof n?.height === "number"
                ? n.height
                : typeof n?.style?.height === "number"
                    ? n.style.height
                    : BASE_H;

        return { w, h };
    });
}

// accent color
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

const PALETTE = {
    "slate-200": { bg: "#e2e8f0", border: "#94a3b8", text: "#0f172a" },
    "blue-600": { bg: "#2563eb", border: "#1d4ed8", text: "#ffffff" },
    "emerald-600": { bg: "#059669", border: "#047857", text: "#ffffff" },
    "amber-500": { bg: "#f59e0b", border: "#d97706", text: "#111827" },
    "rose-600": { bg: "#e11d48", border: "#be123c", text: "#ffffff" },
};

function getUi(data) {
    const ui = data?.ui || {};
    const shape = ui.shape || "rounded"; // rounded | pill | circle | diamond | hex
    const colorKey = ui.colorKey || "slate-200";
    const colors = PALETTE[colorKey] || PALETTE["slate-200"];
    return { shape, colorKey, colors };
}


function execStatus(exec) {
    if (exec?.isActive) return { label: "ACTIVE", dot: "🟦" };
    if (exec?.isOpen) return { label: "OPEN", dot: "🟧" };
    if (exec?.isCompleted) return { label: "DONE", dot: "🟩" };
    return { label: "", dot: "" };
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
    const status = execStatus(exec);
    const hasNotes = !!data?.hasNotes;
    const isOverlay = !!data?.__overlay; // ✅ only dropped nodes
    const { shape, colors } = isOverlay ? getUi(data) : { shape: "rounded", colors: null };
    const useSvgShape = isOverlay && (shape === "diamond" || shape === "hex");

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

    const baseShadow = useSvgShape
        ? "none"
        : isSelected
            ? "var(--wf-node-shadow-strong)"
            : "var(--wf-node-shadow)";

    const finalShadow =
        ring === "none" ? baseShadow :
            baseShadow === "none" ? ring :
                `${ring}, ${baseShadow}`;

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            {/* Resize handles */}
            <NodeResizer
                isVisible={isSelected}
                minWidth={120}
                minHeight={70}
                maxWidth={420}
                maxHeight={260}
            />
            <Handle
                type="target"
                position={Position.Left}
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    border: "2px solid var(--wf-node-handle-border)",
                    background: "var(--wf-node-handle-bg)",
                    boxShadow: isSelected
                        ? "var(--wf-node-shadow-strong)"
                        : "var(--wf-node-shadow)",
                }}
            />

            <Handle
                type="source"
                position={Position.Right}
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    border: "2px solid var(--wf-node-handle-border)",
                    background: "var(--wf-node-handle-bg)",
                    boxShadow: isSelected
                        ? "var(--wf-node-shadow-strong)"
                        : "var(--wf-node-shadow)",
                }}
            />
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: useSvgShape
                        ? 0
                        : shape === "pill"
                            ? 999
                            : shape === "circle"
                                ? "50%"
                                : 18,

                    background: isOverlay
                        ? useSvgShape
                            ? "transparent"
                            : colors.bg
                        : "var(--wf-node-bg)",

                    boxShadow: finalShadow,

                    border: isOverlay
                        ? useSvgShape
                            ? "none"
                            : `2px solid ${colors.border}`
                        : "1px solid var(--wf-node-border)",

                    color: isOverlay ? colors.text : "var(--wf-text)",

                    // only keep your accent bar for base nodes, NOT dropped overlay nodes
                    borderLeft: isOverlay ? "none" : `8px solid ${accent}`,

                    position: "relative",
                }}
            >
                {useSvgShape && (
                    <svg
                        viewBox="0 0 100 60"
                        preserveAspectRatio="none"
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            zIndex: 0,
                            pointerEvents: "none",
                            filter: isSelected
                                ? "drop-shadow(0 18px 34px rgba(15,23,42,0.28))"
                                : "drop-shadow(0 12px 26px rgba(15,23,42,0.20))",
                        }}
                    >
                        {shape === "diamond" ? (
                            <polygon
                                points="50,0 100,30 50,60 0,30"
                                fill={colors.bg}
                                stroke={colors.border}
                                strokeWidth="3"
                            />
                        ) : (
                            <polygon
                                points="15,0 85,0 100,30 85,60 15,60 0,30"
                                fill={colors.bg}
                                stroke={colors.border}
                                strokeWidth="3"
                            />
                        )}
                    </svg>
                )}

                {status.label ? (
                    <div
                        style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            fontSize: 12,
                            fontWeight: 900,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "rgba(15,23,42,0.06)",
                            border: "1px solid rgba(15,23,42,0.12)",
                            zIndex: 2,
                        }}
                    >
                        {status.dot} {status.label}
                    </div>
                ) : null}

                {/* ...the rest of your content stays the same */}

                <div
                    style={{
                        width: BASE_W,
                        height: BASE_H,
                        transformOrigin: "top left",
                        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                        display: "flex",
                        alignItems: "center",
                        padding: "14px 16px",
                        position: "relative",
                        zIndex: 1,
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
                            background: "var(--wf-node-icon-bg)",
                            border: "1px solid var(--wf-node-border)",
                            fontSize: 18,
                            flex: "0 0 auto",
                        }}
                    >
                        {icon}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                            style={{
                                fontWeight: 900,
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
                                color: "var(--wf-subtext)",
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
                            border: "1px solid var(--wf-node-border)",
                            background: "var(--wf-node-chip-bg)",
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



