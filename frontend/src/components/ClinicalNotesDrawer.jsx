import { useEffect, useMemo, useState, useRef } from "react";
const PALETTE = {
    "slate-200": { bg: "#e2e8f0" },
    "blue-600": { bg: "#2563eb" },
    "emerald-600": { bg: "#059669" },
    "amber-500": { bg: "#f59e0b" },
    "rose-600": { bg: "#e11d48" },
};


const SHAPES = ["rounded", "pill", "circle", "diamond", "hex"];
const COLORS = Object.keys(PALETTE);

function ShapePreview({ shape, color }) {
    const base = {
        width: 18,
        height: 14,
        background: color,
        display: "inline-block",
        flex: "0 0 auto",
        marginRight: 8,
        border: "1px solid rgba(0,0,0,0.15)",
    };

    if (shape === "rounded") {
        return <span style={{ ...base, borderRadius: 4 }} />;
    }

    if (shape === "pill") {
        return <span style={{ ...base, borderRadius: 999, width: 20 }} />;
    }

    if (shape === "circle") {
        return <span style={{ ...base, borderRadius: "50%", width: 14, height: 14 }} />;
    }

    if (shape === "diamond") {
        return (
            <span
                style={{
                    ...base,
                    width: 14,
                    height: 14,
                    transform: "rotate(45deg)",
                    borderRadius: 3,
                }}
            />
        );
    }

    if (shape === "hex") {
        return (
            <span
                style={{
                    ...base,
                    width: 18,
                    height: 14,
                    clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                    borderRadius: 0,
                }}
            />
        );
    }

    return <span style={base} />;
}



function NodePreviewBox({ shape, colorKey, palette }) {
    const bg = palette[colorKey]?.bg || "#e2e8f0";

    const boxBase = {
        width: 110,
        height: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: 13,
        color: "#0f172a",
        background: bg,
    };


    let shapeStyle = {};
    let innerRotate = 0;

    switch (shape) {
        case "rounded":
            shapeStyle = { borderRadius: 14 };
            break;
        case "pill":
            shapeStyle = { borderRadius: 999 };
            break;
        case "circle":
            shapeStyle = { borderRadius: "50%", width: 76, height: 76 };
            break;
        case "diamond":
            shapeStyle = {
                borderRadius: "50%",
                width: 90,   // pick a nice size for your UI
                height: 90,
                padding: 0,  // circle usually needs less padding
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            };
            break;

        case "hex":
            shapeStyle = {
                clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                borderRadius: 0,
            };
            break;
        default:
            shapeStyle = { borderRadius: 14 };
    }

    return (
        <div style={{ padding: 10 }}>
            <div style={{ ...boxBase, ...shapeStyle }}>
                <div style={{ transform: innerRotate ? `rotate(${innerRotate}deg)` : "none" }}>
                    Preview
                </div>
            </div>
        </div>
    );
}


export default function ClinicalNotesDrawer({
                                                open,
                                                onClose,
                                                instanceId,
                                                node,
                                                notesByNodeId,
                                                setNotesByNodeId,
                                                onChangeNodeUi,
                                                mode,              // designer-test
                                                activeNodeId,      // string
                                                canCompleteSelected, // boolean
                                                onCompleteActive,
                                            }) {
    const nodeId = node?.id ? String(node.id) : null;
    const title = node?.data?.label || node?.data?.name || nodeId || "Step";

    const ui = node?.data?.ui || { shape: "rounded", colorKey: "slate-200" };

    const isActiveInTest =
        mode === "designer-test" &&
        nodeId &&
        activeNodeId &&
        String(activeNodeId) === String(nodeId);


    const updateUi = (patch) => {
        if (!nodeId) return;
        if (typeof onChangeNodeUi !== "function") return;

        onChangeNodeUi(nodeId, patch);
    };



    const [toast, setToast] = useState(null); // string | null
    const toastTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);



    const value = useMemo(() => {
        if (!nodeId) return "";
        return notesByNodeId?.[nodeId] ?? "";
    }, [notesByNodeId, nodeId]);

    const [draft, setDraft] = useState(value);
    const [preview, setPreview] = useState(null);
// { x, y, shape, colorKey } | null

    useEffect(() => {
        setDraft(value);
    }, [value, nodeId]);

    const saveDraftToState = () => {
        if (!nodeId) return;

        setNotesByNodeId((prev) => ({
            ...(prev || {}),
            [nodeId]: draft,
        }));

        // show confirmation briefly
        setToast("Saved ✓");
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 1400);
    };

    return (
        <>
            {/* overlay */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    background: open ? "var(--notes-overlay)" : "transparent",
                    pointerEvents: open ? "auto" : "none",
                    transition: "background 200ms ease",
                    zIndex: 50,
                }}
                onMouseDown={() => {
                    setPreview(null);
                    saveDraftToState();
                    onClose();
                }}
            />

            {/* drawer */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    height: "100vh",
                    width: 380,
                    maxWidth: "92vw",
                    background: "var(--notes-panel-bg)",
                    color: "var(--notes-text)",
                    borderLeft: "1px solid var(--notes-panel-border)",
                    boxShadow: "var(--notes-panel-shadow)",
                    transform: open ? "translateX(0)" : "translateX(100%)",
                    transition: "transform 220ms ease",
                    zIndex: 60,
                    display: "flex",
                    flexDirection: "column",
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* header */}
                <div style={{ padding: 14, borderBottom: "1px solid var(--notes-panel-border)" }}>
                    ...
                </div>

                {/* ✅ TOAST GOES HERE */}
                {toast && (
                    <div
                        style={{
                            position: "absolute",
                            top: `calc(env(safe-area-inset-top, 0px) + 800px)`, // ✅ was 14
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 999,
                            background: "rgba(15, 23, 42, 0.92)",
                            color: "white",
                            padding: "8px 12px",
                            borderRadius: 999,
                            fontWeight: 900,
                            fontSize: 13,
                            boxShadow: "0 16px 30px rgba(0,0,0,0.25)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            pointerEvents: "none",
                            animation: "notesToastIn 120ms ease-out",
                        }}
                    >
                        {toast}
                    </div>
                )}

                {/* header */}
                <div style={{padding: 14, borderBottom: "1px solid var(--notes-panel-border)"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10}}>
                        <div>
                            <div style={{fontWeight: 950, fontSize: 16}}>Clinical Notes</div>
                            <div style={{color: "var(--notes-muted)", marginTop: 2}}>
                                Instance #{instanceId} • Step: <b>{title}</b>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setPreview(null);
                                saveDraftToState();
                                onClose();
                            }}
                            style={{
                                border: "1px solid var(--notes-btn-border)",
                                background: "var(--notes-btn-bg)",
                                color: "var(--notes-btn-text)",
                                borderRadius: 10,
                                padding: "6px 10px",
                                fontWeight: 900,
                                cursor: "pointer",
                            }}
                        >
                            ✕
                        </button>

                        {isActiveInTest ? (
                            <div
                                style={{
                                    marginTop: 12,
                                    padding: 12,
                                    borderRadius: 14,
                                    border: "1px solid rgba(15,23,42,0.14)",
                                    background: "rgba(15,23,42,0.03)",
                                }}
                            >
                                <div style={{ fontWeight: 950, marginBottom: 8 }}>
                                    Test Run: Active Step
                                </div>

                                <button
                                    type="button"
                                    disabled={!canCompleteSelected}
                                    onClick={() => onCompleteActive?.()}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: 12,
                                        border: "none",
                                        cursor: canCompleteSelected ? "pointer" : "not-allowed",
                                        fontWeight: 900,
                                        background: canCompleteSelected ? "var(--notes-primary-bg)" : "#94a3b8",
                                        color: "var(--notes-primary-text)",
                                    }}
                                >
                                    Complete Task
                                </button>

                                <div style={{ marginTop: 8, fontSize: 12, color: "var(--notes-muted)" }}>
                                    This completes the current active step in the test instance.
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* body */}
                <div style={{padding: 14, display: "flex", flexDirection: "column", gap: 10, flex: 1}}>
                    {!nodeId ? (
                        <div style={{color: "var(--notes-muted)"}}>
                            Click a step on the canvas to write notes.
                        </div>
                    ) : (
                        <>
                            {/* Appearance (ONLY for dropped nodes) */}

                            <div
                                style={{
                                    border: "1px solid var(--notes-panel-border)",
                                    background: "var(--notes-input-bg)",
                                    borderRadius: 14,
                                    padding: 12,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                }}
                            >
                                <div style={{fontWeight: 950}}>Appearance</div>

                                {/* Shape picker */}
                                <div>
                                    <div style={{
                                        fontWeight: 900,
                                        fontSize: 13,
                                        marginBottom: 8,
                                        color: "var(--notes-muted)"
                                    }}>
                                        Shape
                                    </div>
                                    <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
                                        {SHAPES.map((s) => (
                                            <button
                                                type="button"
                                                key={s}
                                                onPointerDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    updateUi({shape: s});
                                                }}
                                                onPointerEnter={(e) => {
                                                    setPreview({
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                        shape: s,
                                                        colorKey: ui.colorKey,
                                                    });
                                                }}
                                                onPointerMove={(e) => {
                                                    setPreview((p) => (p ? {...p, x: e.clientX, y: e.clientY} : p));
                                                }}
                                                onPointerLeave={() => setPreview(null)}
                                                style={{
                                                    border:
                                                        ui.shape === s
                                                            ? "2px solid var(--notes-primary-bg)"
                                                            : "1px solid var(--notes-btn-border)",
                                                    background: "var(--notes-btn-bg)",
                                                    color: "var(--notes-btn-text)",
                                                    borderRadius: 10,
                                                    padding: "6px 10px",
                                                    fontWeight: 900,
                                                    cursor: "pointer",
                                                    opacity: ui.shape === s ? 1 : 0.85,
                                                }}
                                            >
                                                    <span
                                                        style={{display: "inline-flex", alignItems: "center", gap: 8}}>
                                                    <ShapePreview shape={s}
                                                                  color={PALETTE[ui.colorKey]?.bg || "#e2e8f0"}/><span
                                                        style={{textTransform: "capitalize"}}>{s}</span>
                                                    </span>
                                            </button>
                                        ))}

                                    </div>
                                </div>

                                {/* Color picker */}
                                <div>
                                    <div style={{
                                        fontWeight: 900,
                                        fontSize: 13,
                                        marginBottom: 8,
                                        color: "var(--notes-muted)"
                                    }}>
                                        Color
                                    </div>
                                    <div style={{display: "flex", gap: 10, flexWrap: "wrap"}}>
                                        {COLORS.map((k) => (
                                            <button
                                                type="button"
                                                key={k}
                                                onPointerDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    updateUi({colorKey: k});
                                                }}
                                                onPointerEnter={(e) => {
                                                    setPreview({
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                        shape: ui.shape,
                                                        colorKey: k,
                                                    });
                                                }}
                                                onPointerMove={(e) => {
                                                    setPreview((p) => (p ? {...p, x: e.clientX, y: e.clientY} : p));
                                                }}
                                                onPointerLeave={() => setPreview(null)}
                                                style={{
                                                    width: 26,
                                                    height: 26,
                                                    borderRadius: 999,
                                                    cursor: "pointer",
                                                    background: PALETTE[k].bg,
                                                    border:
                                                        ui.colorKey === k
                                                            ? "3px solid var(--notes-primary-bg)"
                                                            : "1px solid var(--notes-btn-border)",
                                                }}
                                            />
                                        ))}


                                    </div>
                                </div>

                                <div style={{fontSize: 12, color: "var(--notes-muted)"}}>
                                    Applies only to nodes you dragged onto the canvas.
                                </div>
                            </div>


                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder="Write clinical notes here…"
                                style={{
                                    width: "100%",
                                    flex: 1,
                                    resize: "none",
                                    borderRadius: 14,
                                    padding: 12,
                                    background: "var(--notes-input-bg)",
                                    color: "var(--notes-input-text)",
                                    border: "1px solid var(--notes-input-border)",
                                    outline: "none",
                                    fontFamily: "inherit",
                                    fontSize: 14,
                                    lineHeight: 1.4,
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.boxShadow = `0 0 0 4px var(--notes-focus)`;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />

                            <div style={{display: "flex", justifyContent: "space-between", gap: 8}}>
                                <button
                                    onClick={() => setDraft("")}
                                    style={{
                                        border: "1px solid var(--notes-btn-border)",
                                        background: "var(--notes-btn-bg)",
                                        color: "var(--notes-btn-text)",
                                        borderRadius: 12,
                                        padding: "10px 12px",
                                        fontWeight: 900,
                                        cursor: "pointer",
                                    }}
                                >
                                    Clear
                                </button>

                                <button
                                    onClick={saveDraftToState}
                                    style={{
                                        border: "none",
                                        background: "var(--notes-primary-bg)",
                                        color: "var(--notes-primary-text)",
                                        borderRadius: 12,
                                        padding: "10px 12px",
                                        fontWeight: 900,
                                        cursor: "pointer",
                                    }}
                                >
                                    Save notes (local)
                                </button>
                            </div>

                            <div style={{fontSize: 12, color: "var(--notes-muted)"}}>
                                Notes are saved permanently when you click the main <b>Save</b> button.
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* placeholder color for textarea (must be CSS) */}
            <style>{`
        textarea::placeholder {
          color: var(--notes-input-placeholder);
        }
      `}</style>

            <style>{`
@keyframes fadeInPreview {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
`}</style>


            {preview && (
                <div
                    style={{
                        position: "fixed",
                        left: Math.min(preview.x + 16, window.innerWidth - 180),
                        top: Math.min(preview.y + 16, window.innerHeight - 160),
                        zIndex: 9999,
                        pointerEvents: "none",
                        animation: "fadeInPreview 120ms ease-out",
                    }}
                >
                    <div
                        style={{
                            borderRadius: 16,
                            background: "rgba(15, 23, 42, 0.96)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            backdropFilter: "blur(6px)",
                            padding: 10,
                            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                            minWidth: 150,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 12,
                                fontWeight: 800,
                                opacity: 0.8,
                                marginBottom: 8,
                                textTransform: "capitalize",
                            }}
                        >
                            {preview.shape} • {preview.colorKey}
                        </div>

                        <NodePreviewBox
                            shape={preview.shape}
                            colorKey={preview.colorKey}
                            palette={PALETTE}
                        />
                    </div>
                </div>
            )}


        </>
    );
}
