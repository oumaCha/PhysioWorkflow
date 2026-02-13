import { useEffect, useMemo, useState } from "react";

export default function ClinicalNotesDrawer({
                                                open,
                                                onClose,
                                                instanceId,
                                                node,
                                                notesByNodeId,
                                                setNotesByNodeId,
                                            }) {
    const nodeId = node?.id ? String(node.id) : null;
    const title = node?.data?.label || node?.data?.name || nodeId || "Step";

    const value = useMemo(() => {
        if (!nodeId) return "";
        return notesByNodeId?.[nodeId] ?? "";
    }, [notesByNodeId, nodeId]);

    const [draft, setDraft] = useState(value);

    useEffect(() => {
        setDraft(value);
    }, [value, nodeId]);

    const saveDraftToState = () => {
        if (!nodeId) return;
        setNotesByNodeId((prev) => ({
            ...(prev || {}),
            [nodeId]: draft,
        }));
    };

    return (
        <>
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    background: open ? "rgba(0,0,0,0.25)" : "transparent",
                    pointerEvents: open ? "auto" : "none",
                    transition: "background 200ms ease",
                    zIndex: 50,
                }}
                onMouseDown={() => {
                    saveDraftToState();
                    onClose();
                }}
            />

            <div
                style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    height: "100vh",
                    width: 380,
                    maxWidth: "92vw",
                    background: "#ffffff",
                    borderLeft: "1px solid rgba(15,23,42,0.12)",
                    boxShadow: "-12px 0 30px rgba(0,0,0,0.12)",
                    transform: open ? "translateX(0)" : "translateX(100%)",
                    transition: "transform 220ms ease",
                    zIndex: 60,
                    display: "flex",
                    flexDirection: "column",
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div style={{ padding: 14, borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
                        <div>
                            <div style={{ fontWeight: 950, fontSize: 16 }}>Clinical Notes</div>
                            <div style={{ opacity: 0.7, marginTop: 2 }}>
                                Instance #{instanceId} • Step: <b>{title}</b>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                saveDraftToState();
                                onClose();
                            }}
                            style={{
                                border: "1px solid rgba(15,23,42,0.15)",
                                background: "white",
                                borderRadius: 10,
                                padding: "6px 10px",
                                fontWeight: 900,
                                cursor: "pointer",
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    {!nodeId ? (
                        <div style={{ opacity: 0.75 }}>
                            Click a step on the canvas to write notes.
                        </div>
                    ) : (
                        <>
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
                      border: "1px solid rgba(15,23,42,0.18)",
                      outline: "none",
                      fontFamily: "inherit",
                      fontSize: 14,
                      lineHeight: 1.4,
                  }}
              />

                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                <button
                                    onClick={() => setDraft("")}
                                    style={{
                                        border: "1px solid rgba(15,23,42,0.15)",
                                        background: "white",
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
                                        background: "#0f172a",
                                        color: "white",
                                        borderRadius: 12,
                                        padding: "10px 12px",
                                        fontWeight: 900,
                                        cursor: "pointer",
                                    }}
                                >
                                    Save notes (local)
                                </button>
                            </div>

                            <div style={{ fontSize: 12, opacity: 0.65 }}>
                                Notes are saved permanently when you click the main <b>Save</b> button.
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
