import { useEffect, useMemo, useState } from "react";
import { workflowApi, openReceptionPatientWorkflow  } from "../workflow/api/workflowApi";
import { useNavigate } from "react-router-dom";

function Card({ children, style }) {
    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border-soft)",
                borderRadius: 22,
                padding: 16,
                overflow: "hidden",
                boxShadow: "0 14px 40px rgba(0,0,0,0.08)", // neutral shadow (ok in both themes)
                ...style,
            }}
        >
            {children}
        </div>
    );
}

function Pill({ children, tone = "neutral" }) {
    // Keep the same semantic tones but make them theme-friendly:
    // - no #0f172a
    // - neutral uses theme text + borders
    const tones = {
        neutral: {
            bg: "var(--pill-neutral-bg, rgba(2, 132, 199, 0.08))",
            border: "var(--pill-neutral-border, var(--border-soft))",
            fg: "var(--text-main)",
        },
        waiting: {
            bg: "rgba(59,130,246,0.14)",
            border: "rgba(59,130,246,0.30)",
            fg: "var(--pill-waiting-fg, #1d4ed8)",
        },
        consult: {
            bg: "rgba(168,85,247,0.14)",
            border: "rgba(168,85,247,0.30)",
            fg: "var(--pill-consult-fg, #7c3aed)",
        },
        treat: {
            bg: "rgba(16,185,129,0.16)",
            border: "rgba(16,185,129,0.30)",
            fg: "var(--pill-treat-fg, #047857)",
        },
        done: {
            bg: "rgba(148,163,184,0.18)",
            border: "rgba(148,163,184,0.35)",
            fg: "var(--pill-done-fg, #334155)",
        },
    };

    const t = tones[tone] || tones.neutral;

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 900,
                background: t.bg,
                border: `1px solid ${t.border}`,
                color: t.fg,
                whiteSpace: "nowrap",
            }}
        >
      {children}
    </span>
    );
}

function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
}

function statusTone(label) {
    const s = String(label || "").toLowerCase();
    if (s.includes("added") || s.includes("waiting")) return "waiting";
    if (s.includes("first consultation")) return "consult";
    if (s.includes("treatment")) return "treat";
    if (s.includes("end")) return "done";
    return "neutral";
}

const thStyle = {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 1000,
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--border-soft)",
    background: "var(--table-head-bg, rgba(127,127,127,0.08))",
};

const tdStyle = {
    padding: "12px",
    borderBottom: "1px solid var(--border-soft)",
    verticalAlign: "top",
    color: "var(--text-main)",
};

function Spinner({ size = 14 }) {
    return (
        <span
            style={{
                width: size,
                height: size,
                border: "2px solid var(--border-soft)",
                borderTopColor: "var(--spinner-top, #2563eb)",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.8s linear infinite",
            }}
        />
    );
}



export default function ReceptionDashboard({ auth }) {
    const [patients, setPatients] = useState([]);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [treatmentArea, setTreatmentArea] = useState("");
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [loadingList, setLoadingList] = useState(false);
    const [savingPatient, setSavingPatient] = useState(false);
    const [openingId, setOpeningId] = useState(null);
    const [sessionsPlanned, setSessionsPlanned] = useState(5);


    const [closingId, setClosingId] = useState(null);


    // Optional: show if refresh actually happens
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // ✅ theme-aware input style
    const inputStyle = {
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid var(--border-soft)",
        outline: "none",
        fontSize: 14,
        background: "var(--surface)",
        color: "var(--text-main)",
    };

    const loadPatients = async () => {
        try {
            setError("");
            setLoadingList(true);

            const data = await workflowApi.listReceptionPatients(auth);
            setPatients(Array.isArray(data) ? data : []);
            setLastRefreshed(new Date().toLocaleTimeString());
        } catch (e) {
            setError(String(e.message || e));
        } finally {
            setLoadingList(false);
        }
    };

    const addPatient = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            setError("Please enter first and last name.");
            return;
        }
        if (treatmentArea.trim().length > 255) {
            setError("Please keep the physiotherapy text under 255 characters.");
            return;
        }

        try {
            setError("");
            setSavingPatient(true);

            await workflowApi.createReceptionPatient(
                {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    treatmentArea: treatmentArea.trim(),
                    sessionsPlanned: Number(sessionsPlanned)
                },
                auth
            );

            setFirstName("");
            setLastName("");
            setTreatmentArea("");

            await loadPatients();
        } catch (e) {
            const msg = e?.response?.data?.message || e?.message || "Failed to add patient";
            setError(msg);
        } finally {
            setSavingPatient(false);
        }
    };

    useEffect(() => {
        loadPatients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return patients;
        return patients.filter((p) => {
            const name = String(p.displayLabel || "").toLowerCase();
            const area = String(p.treatmentArea || "").toLowerCase();
            return name.includes(q) || area.includes(q);
        });
    }, [patients, search]);

    const styles = {
        page: { padding: 10, color: "var(--text-main)" },

        // decorative wrapper: keep it subtle and theme-friendly
        hero: {
            borderRadius: 28,
            padding: 18,
            background:
                "radial-gradient(1200px 700px at 20% 0%, rgba(20,184,166,0.14), transparent 60%)," +
                "radial-gradient(900px 600px at 90% 10%, rgba(59,130,246,0.14), transparent 55%)",
            border: "1px solid var(--border-soft)",
        },

        grid: {
            display: "grid",
            gap: 12,
            gridTemplateColumns: "minmax(0, 0.95fr) minmax(0, 1.35fr)",
            alignItems: "start",
        },

        h1: { fontSize: 22, fontWeight: 1000, color: "var(--text-main)" },
        sub: { marginTop: 6, fontSize: 13, color: "var(--text-muted)" },

        error: {
            marginTop: 12,
            padding: 12,
            borderRadius: 14,
            background: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            color: "var(--danger-text)",
            fontWeight: 800,
            fontSize: 13,
            whiteSpace: "pre-wrap",
        },

        btnPrimary: (disabled) => ({
            border: "none",
            background: "var(--btn-primary-bg)",
            color: "var(--btn-primary-text)",
            padding: "12px 14px",
            borderRadius: 999,
            fontWeight: 1000,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.7 : 1,
        }),

        btnSecondary: (disabled) => ({
            border: "1px solid var(--btn-secondary-border)",
            background: "var(--btn-secondary-bg)",
            color: "var(--btn-secondary-text)",
            padding: "10px 14px",
            borderRadius: 999,
            fontWeight: 900,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            pointerEvents: disabled ? "none" : "auto",
            opacity: disabled ? 0.7 : 1,
            cursor: "pointer",
        }),

        btnRow: (disabled) => ({
            border: "1px solid var(--btn-secondary-border)",
            background: disabled
                ? "var(--surface)"
                : "var(--btn-secondary-bg)",
            color: "var(--btn-secondary-text)",
            padding: "8px 14px",
            borderRadius: 999,
            fontWeight: 900,
            fontSize: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.55 : 1,
            transition: "all 0.18s ease",
        }),
    };

    const navigate = useNavigate();

    async function handleOpenWorkflow(patientId) {
        try {
            setError("");
            setOpeningId(patientId);

            const instanceId = await openReceptionPatientWorkflow(patientId);
            navigate(`/canvas/${instanceId}`);
        } catch (e) {
            // backend will send 409 with "Prescription already done."
            const msg = e?.message || String(e);
            if (msg.toLowerCase().includes("409") || msg.toLowerCase().includes("prescription already done")) {
                setError("Prescription is already done for this patient.");
            } else {
                setError(msg);
            }
        } finally {
            setOpeningId(null);
        }
    }

    async function handleConfirmPaymentAndClose(patientId) {
        try {
            setError("");
            setClosingId(patientId);
            await workflowApi.confirmReceptionPaymentAndClose(patientId);
            setError("Payment confirmed ✓ Case closed ✓");
            await loadPatients();
        } catch (e) {
            setError(e?.message || String(e));
        } finally {
            setClosingId(null);
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.hero}>
                <div className="rxGrid" style={styles.grid}>
                    {/* Add Patient card */}
                    <Card>
                        <div style={styles.h1}>Add Patient</div>
                        <div style={styles.sub}>Reception view — administrative only.</div>

                        {error && <div style={styles.error}>{error}</div>}

                        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                                    gap: 12,
                                    alignItems: "start",
                                }}
                            >
                                <div style={{ display: "grid", gap: 6 }}>
                                    <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text-muted)" }}>
                                        First name
                                    </label>
                                    <input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="First name"
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ display: "grid", gap: 6 }}>
                                    <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text-muted)" }}>
                                        Last name
                                    </label>
                                    <input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Last name"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gap: 6 }}>
                                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text-muted)" }}>
                                    Physiotherapy area/type (free text)
                                </label>

                                <textarea
                                    value={treatmentArea}
                                    onChange={(e) => setTreatmentArea(e.target.value)}
                                    placeholder="e.g. knee injury, 5kg restriction"
                                    rows={4}
                                    style={{
                                        ...inputStyle,
                                        resize: "vertical",
                                        maxHeight: 140,
                                        overflow: "auto",
                                    }}
                                />

                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                    {treatmentArea.length}/255
                                </div>
                            </div>

                            {/* ✅ ADD THIS BLOCK HERE */}
                            <div style={{ display: "grid", gap: 6 }}>
                                <label style={{ fontSize: 12, fontWeight: 900, color: "var(--text-muted)" }}>
                                    Sessions planned
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={sessionsPlanned}
                                    onChange={(e) => setSessionsPlanned(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={addPatient}
                                disabled={savingPatient}
                                style={styles.btnPrimary(savingPatient)}
                            >
                                {savingPatient ? "Saving..." : "Add Patient"}
                            </button>
                        </div>
                    </Card>

                    {/* Recent Patients table */}
                    <Card>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                            <div>
                                <div style={styles.h1}>Recent Patients</div>
                                <div style={styles.sub}>Progress is shown as phase + session count (no details).</div>
                                {lastRefreshed && (
                                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>
                                        Last refreshed: {lastRefreshed}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search patients"
                                    style={{ ...inputStyle, width: 220, borderRadius: 999 }}
                                />

                                <button type="button" onClick={loadPatients} style={styles.btnSecondary(loadingList)}>
                                    {loadingList && <Spinner size={14} />}
                                    Refresh
                                </button>
                            </div>
                        </div>

                        <div style={{ marginTop: 14, overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                                <thead>
                                <tr>
                                    <th style={thStyle}>Name</th>
                                    <th style={thStyle}>Date added</th>
                                    <th style={thStyle}>Progress</th>
                                    <th style={thStyle}>Action</th>
                                    <th style={thStyle}>Payment</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ padding: 14, color: "var(--text-muted)" }}>
                                            No patients found.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((p) => {
                                        const tone = statusTone(p.statusLabel);
                                        const done = typeof p.sessionsDone === "number" ? p.sessionsDone : null;
                                        const planned = typeof p.sessionsPlanned === "number" ? p.sessionsPlanned : null;
                                        const progress = done != null && planned != null ? `${done}/${planned}` : null;
                                        const canOpen = String(p.statusLabel || "").toLowerCase() === "added";
                                        const busy = openingId === p.id;
                                        const isPaymentStep =
                                            ["t_billing", "t_close_case"].includes(String(p.currentNodeId || ""));
                                        const closingBusy = closingId === p.id; // this line must be inside map (see below)
                                        return (
                                            <tr key={p.id}>
                                                <td style={tdStyle}>
                                                    <div style={{
                                                        fontWeight: 1000,
                                                        color: "var(--text-main)"
                                                    }}>{p.displayLabel}</div>
                                                    <div style={{
                                                        fontSize: 12,
                                                        color: "var(--text-muted)",
                                                        marginTop: 2
                                                    }}>
                                                        {p.treatmentArea || "—"}
                                                    </div>
                                                </td>

                                                <td style={tdStyle}>
                                                    <div style={{
                                                        fontSize: 13,
                                                        color: "var(--text-main)",
                                                        opacity: 0.95
                                                    }}>
                                                        {fmtDate(p.createdAt)}
                                                    </div>
                                                </td>

                                                <td style={tdStyle}>
                                                    <div style={{
                                                        display: "flex",
                                                        gap: 10,
                                                        alignItems: "center",
                                                        flexWrap: "wrap"
                                                    }}>
                                                        <Pill tone={tone}>{p.statusLabel || "—"}</Pill>
                                                        {progress && <Pill tone="neutral">Session {progress}</Pill>}
                                                    </div>
                                                </td>
                                                <td style={tdStyle}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenWorkflow(p.id)}
                                                        disabled={!canOpen || busy}
                                                        style={styles.btnRow(!canOpen || busy)}
                                                        title={!canOpen ? "Prescription already done" : "Open workflow"}
                                                    >
                                                        {busy ? <Spinner size={14}/> : "🧾"}
                                                        {canOpen ? "Open workflow" : "Done"}
                                                    </button>
                                                </td >
                                                <td style={tdStyle}>
                                                    {isPaymentStep && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleConfirmPaymentAndClose(p.id)}
                                                            disabled={closingBusy}
                                                            style={styles.btnPrimary(closingBusy)}
                                                            title="Confirm payment and close the case"
                                                        >
                                                            {closingBusy ? "Processing…" : "Confirm payment & close"}
                                                        </button>
                                                    )}
                                                </td>

                                            </tr>

                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
            </div>
        </div>
    );
}
