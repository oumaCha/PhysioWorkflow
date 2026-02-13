import { useEffect, useMemo, useState } from "react";
import { workflowApi } from "../workflow/api/workflowApi";
import TaskFormModal from "../components/TaskFormModal";
import JourneyTimeline from "../components/JourneyTimeline";

// Small helpers so we don't repeat style objects everywhere
const styles = {
    page: {
        display: "grid",
        gap: 14,
        color: "var(--text-main)",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: { fontWeight: 950, fontSize: 18 },

    btnRow: { display: "flex", gap: 8 },

    btnPrimary: (disabled) => ({
        border: "none",
        background: "var(--btn-primary-bg)",
        color: "var(--btn-primary-text)",
        padding: "8px 12px",
        borderRadius: 12,
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
    }),

    btnSecondary: (disabled) => ({
        border: "1px solid var(--btn-secondary-border)",
        background: "var(--btn-secondary-bg)",
        color: "var(--btn-secondary-text)",
        padding: "8px 12px",
        borderRadius: 12,
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
    }),

    errorBox: {
        padding: 12,
        borderRadius: 12,
        background: "var(--danger-bg)",
        color: "var(--danger-text)",
        border: "1px solid var(--danger-border)",
        fontWeight: 800,
    },

    grid3: {
        display: "grid",
        gridTemplateColumns: "1.1fr 1.2fr 1fr",
        gap: 14,
        alignItems: "start",
    },

    panel: {
        border: "1px solid var(--border-soft)",
        borderRadius: 18,
        background: "var(--surface)",
        overflow: "hidden",
    },

    panelHeader: {
        padding: 12,
        borderBottom: "1px solid var(--border-soft)",
        fontWeight: 950,
        color: "var(--text-main)",
    },

    panelBody: { padding: 12 },

    muted: { color: "var(--text-muted)", fontSize: 12 },
    mutedLine: { color: "var(--text-muted)", opacity: 0.95 },
    empty: { color: "var(--text-muted)" },

    card: {
        border: "1px solid var(--border-soft)",
        borderRadius: 16,
        padding: 12,
        display: "grid",
        gap: 8,
        background: "var(--surface)",
        color: "var(--text-main)",
    },

    selectedCardBg: "var(--selected-soft, rgba(2,132,199,0.08))", // fallback if you don't define it
};

export default function PhysioDashboard({ auth, onOpenTask, onOpenInstance }) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [tasks, setTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    // fallback modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTask, setModalTask] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalErr, setModalErr] = useState("");

    // Patients
    const [patientsLoading, setPatientsLoading] = useState(false);
    const [patientsErr, setPatientsErr] = useState("");
    const [patients, setPatients] = useState([]);

    const refreshTasks = async () => {
        setLoading(true);
        setErr("");
        try {
            const data = await workflowApi.listTasks("OPEN", auth);
            setTasks(Array.isArray(data) ? data : []);
        } catch (e) {
            setErr(String(e?.message || e));
        } finally {
            setLoading(false);
        }
    };

    const refreshPatients = async () => {
        setPatientsLoading(true);
        setPatientsErr("");
        try {
            const data = await workflowApi.listPhysioPatients(auth);
            setPatients(Array.isArray(data) ? data : []);
        } catch (e) {
            setPatientsErr(String(e?.message || e));
        } finally {
            setPatientsLoading(false);
        }
    };

    const openWorkflowForPatient = async (patientId) => {
        setPatientsLoading(true);
        setPatientsErr("");
        try {
            const resp = await workflowApi.openPatientWorkflow(patientId, auth);
            const instanceId = typeof resp === "number" ? resp : Number(resp);

            if (!instanceId || Number.isNaN(instanceId)) {
                throw new Error("Backend did not return a valid instanceId");
            }

            await refreshPatients();
            await refreshTasks();
            if (onOpenInstance) onOpenInstance(instanceId);
        } catch (e) {
            setPatientsErr(String(e?.message || e));
        } finally {
            setPatientsLoading(false);
        }
    };

    useEffect(() => {
        refreshTasks();
        refreshPatients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedTask = useMemo(
        () => tasks.find((t) => t.id === selectedTaskId) || null,
        [tasks, selectedTaskId]
    );

    const activeJourneyKey = useMemo(() => {
        if (!selectedTask) return "referral";

        const node = selectedTask.nodeId;

        // Last consult stage
        if (["t_outcome", "t_report", "t_billing", "t_close_case"].includes(node)) {
            return "consultLast";
        }

        // 1st consult stage
        if (["t_assessment"].includes(node)) {
            return "consult1";
        }

        // Treatment stage
        if ([
            "t_plan",
            "t_schedule",
            "t_session",
            "t_reschedule",
            "t_home_program"
        ].includes(node)) {
            return "treatment";
        }

        // Everything else = Referral / intake stage
        return "referral";
    }, [selectedTask]);


    const sortedPatients = useMemo(() => {
        const arr = Array.isArray(patients) ? [...patients] : [];
        return arr.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    }, [patients]);


    const patientByInstance = useMemo(() => {
        const map = new Map();
        (sortedPatients || []).forEach((p) => {
            if (p?.workflowInstanceId != null) {
                map.set(Number(p.workflowInstanceId), p);
            }
        });
        return map;
    }, [sortedPatients]);



    const openTaskInlineModal = async (taskId) => {
        setModalOpen(true);
        setModalTask(null);
        setModalErr("");
        setModalLoading(true);
        try {
            const t = await workflowApi.getTask(taskId, auth);
            setModalTask(t);
        } catch (e) {
            setModalErr(String(e?.message || e));
        } finally {
            setModalLoading(false);
        }
    };

    const handleOpen = (t) => {
        if (onOpenTask) return onOpenTask(t);
        openTaskInlineModal(t.id);
    };

    const handleSubmit = async (values) => {
        if (!modalTask?.id) return;
        setModalErr("");
        setModalLoading(true);
        try {
            await workflowApi.completeTask(modalTask.id, values, auth);
            setModalOpen(false);
            setModalTask(null);
            await refreshTasks();
        } catch (e) {
            setModalErr(String(e?.message || e));
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.headerRow}>
                <div style={styles.title}>Dashboard</div>

                <div style={styles.btnRow}>
                    <button
                        onClick={refreshPatients}
                        disabled={patientsLoading}
                        style={styles.btnSecondary(patientsLoading)}
                    >
                        {patientsLoading ? "Loading…" : "Refresh patients"}
                    </button>

                    <button
                        onClick={refreshTasks}
                        disabled={loading}
                        style={styles.btnPrimary(loading)}
                    >
                        {loading ? "Loading…" : "Refresh tasks"}
                    </button>
                </div>
            </div>

            {err ? <div style={styles.errorBox}>{err}</div> : null}

            <div style={styles.grid3}>
                {/* Patients */}
                <div style={styles.panel}>
                    <div style={styles.panelHeader}>Patients</div>

                    <div style={styles.panelBody}>
                        {patientsErr ? <div style={styles.errorBox}>{patientsErr}</div> : null}

                        {patients.length === 0 ? (
                            <div style={styles.empty}>No patients yet.</div>
                        ) : (
                            <div style={{ display: "grid", gap: 10 }}>
                                {sortedPatients.map((p) => (
                                    <div key={p.id} style={styles.card}>
                                        <div style={{ fontWeight: 950 }}>
                                            {p.fullName || `Patient #${p.id}`}
                                        </div>
                                        <div style={styles.muted}>status: {p.status}</div>

                                        {p.referralText ? (
                                            <div style={{ fontSize: 12, color: "var(--text-main)", opacity: 0.9, whiteSpace: "pre-wrap" }}>
                                                {p.referralText}
                                            </div>
                                        ) : null}

                                        <button
                                            onClick={() => openWorkflowForPatient(p.id)}
                                            disabled={patientsLoading}
                                            style={{ ...styles.btnPrimary(patientsLoading), width: "fit-content" }}
                                        >
                                            Open workflow
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks */}
                <div style={styles.panel}>
                    <div style={styles.panelHeader}>Tasks</div>

                    <div style={styles.panelBody}>
                        {tasks.length === 0 ? (
                            <div style={styles.empty}>No OPEN tasks yet. Start an instance first.</div>
                        ) : (
                            <div style={{ display: "grid", gap: 10 }}>
                                {tasks.map((t) => {
                                    const isSelected = selectedTaskId === t.id;
                                    const patient = patientByInstance.get(Number(t.instanceId));

                                    return (
                                        <div
                                            key={t.id}
                                            style={{
                                                ...styles.card,
                                                background: isSelected ? styles.selectedCardBg : "var(--surface)",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                                <div style={{display: "grid"}}>
                                                    <div style={{fontWeight: 950}}>
                                                        {t.title || t.name || t.nodeId || `Task #${t.id}`}
                                                    </div>
                                                    <div style={styles.muted}>
                                                        {patient ? (
                                                            <div style={{marginBottom: 4}}>
                                                                for: <strong>{patient.fullName || `Patient #${patient.id}`}</strong>
                                                            </div>
                                                        ) : (
                                                            <div style={{marginBottom: 4, opacity: 0.85}}>
                                                                for: <strong>Unknown patient</strong>
                                                            </div>
                                                        )}

                                                        instanceId: {t.instanceId} • nodeId: {t.nodeId} •
                                                        status: {t.status}
                                                    </div>

                                                </div>

                                                <div style={{display: "flex", gap: 8}}>
                                                    <button
                                                        onClick={() => setSelectedTaskId(t.id)}
                                                        style={styles.btnSecondary(false)}
                                                    >
                                                        Details
                                                    </button>

                                                    <button
                                                        onClick={() => handleOpen(t)}
                                                        disabled={t.status !== "OPEN"}
                                                        style={styles.btnPrimary(t.status !== "OPEN")}
                                                    >
                                                        Open
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Case view */}
                <div style={styles.panel}>
                    <div style={styles.panelHeader}>Case view</div>
                    <div style={styles.panelBody}>
                        {selectedTask ? (
                            <>
                                <div style={{ fontWeight: 950, marginBottom: 8 }}>
                                    {selectedTask.title || selectedTask.name || selectedTask.nodeId}
                                </div>
                                <JourneyTimeline activeKey={activeJourneyKey} />

                            </>
                        ) : (
                            <div style={styles.empty}>Select a task to see timeline.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Fallback modal */}
            <TaskFormModal
                open={modalOpen}
                task={modalTask}
                loading={modalLoading}
                error={modalErr}
                onClose={() => {
                    setModalOpen(false);
                    setModalTask(null);
                    setModalErr("");
                }}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
