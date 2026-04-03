import { useEffect, useMemo, useState } from "react";
import { workflowApi } from "../workflow/api/workflowApi";
import TaskFormModal from "../components/TaskFormModal";
import JourneyTimeline from "../components/JourneyTimeline";


const STATUS_LABEL = {
    REFERRAL_RECEIVED: "Referral received",
    PRESCRIPTION_CHECK: "Prescription check",
    DEADLINE_CHECK: "Deadline check",
    COPAY_CHECK: "Co-pay check",

    FIRST_CONSULTATION: "First consultation",
    CONSENT: "Consent",
    ASSESSMENT: "Assessment",
    PAIN_DECISION_FIRST: "Pain decision (after assessment)",
    DOCTOR_REFERRAL_EARLY: "Refer to doctor (early stop)",
    TREATMENT_PLANNING: "Treatment planning",
    SCHEDULING: "Scheduling",

    TREATMENT: "Treatment",
    HOME_PROGRAM: "Home program",

    OUTCOME: "Outcome",
    PAIN_DECISION_OUTCOME: "Pain decision (after outcome)",
    DOCTOR_REFERRAL_OUTCOME: "Refer to doctor (after outcome)",
    REPORT: "Report",
    BILLING: "Billing",
    CLOSED: "Closed",

    IN_PROGRESS: "In progress",
    DECISION: "Decision",
    UNKNOWN: "Unknown",
};

const prettyStatus = (s) => STATUS_LABEL[s] ?? s ?? "—";



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

    grid2: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 16,
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

    const [modalPrefill, setModalPrefill] = useState({});

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


    const sortedTasks = useMemo(() => {
        const arr = Array.isArray(tasks) ? [...tasks] : [];

        return arr.sort((a, b) => {
            // sort by patient id (newest patient first)
            const pa = patientByInstance.get(Number(a.instanceId));
            const pb = patientByInstance.get(Number(b.instanceId));
            const paId = Number(pa?.id ?? 0);
            const pbId = Number(pb?.id ?? 0);
            if (pbId !== paId) return pbId - paId;

            // fallback: newest workflow instance first
            const ia = Number(a.instanceId ?? 0);
            const ib = Number(b.instanceId ?? 0);
            if (ib !== ia) return ib - ia;

            // fallback: newest task first
            return Number(b.id ?? 0) - Number(a.id ?? 0);
        });
    }, [tasks, patientByInstance]);





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

        const p = patientByInstance.get(Number(t?.instanceId));

        // Prefill the next session number automatically
        if (t?.nodeId === "t_session" && p) {
            const done = Number(p?.sessionsDone ?? 0);
            setModalPrefill({ sessionNumber: done + 1 });
        } else {
            setModalPrefill({});
        }

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

          //  refresh both tasks nd patients
            await refreshTasks();
            await refreshPatients();
        } catch (e) {
            setModalErr(String(e?.message || e));
        } finally {
            setModalLoading(false);
        }
    };


    const getJourneyKeyFromStatus = (status) => {
        if (!status) return "referral";

        // Last consultation
        if ([
            "OUTCOME",
            "PAIN_DECISION_OUTCOME",
            "DOCTOR_REFERRAL_OUTCOME",
            "REPORT",
            "BILLING",
            "CLOSED",
        ].includes(status)) return "consultLast";

        // 1st consultation
        if ([
            "FIRST_CONSULTATION",
            "CONSENT",
            "ASSESSMENT",
            "PAIN_DECISION_FIRST",      //  add
            "DOCTOR_REFERRAL_EARLY",    //  keep here or move to referral
        ].includes(status)) return "consult1";

        // Treatment
        if ([
            "TREATMENT_PLANNING",
            "SCHEDULING",
            "TREATMENT",
            "HOME_PROGRAM",
        ].includes(status)) return "treatment";

        return "referral";
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

            <div style={styles.grid2}>
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
                                    <div
                                        key={p.id}
                                        style={{
                                            ...styles.card,
                                            padding: 16,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 10,
                                        }}
                                    >
                                        {/* Header */}
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                        }}>
                                            <div style={{fontWeight: 900, fontSize: 16}}>
                                                {p.fullName || `Patient #${p.id}`}
                                            </div>

                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    padding: "4px 8px",
                                                    borderRadius: 20,
                                                    background: "var(--selected-soft, rgba(2,132,199,0.1))",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {prettyStatus(p.status)}
                                            </div>
                                        </div>

                                        {/* Treatment + Sessions */}
                                        <div style={{fontSize: 13, display: "grid", gap: 4}}>
                                            <div>
                                                <strong>Treatment:</strong> {p.treatmentArea ?? p.treatmentType ?? "—"}
                                            </div>

                                            <div>
                                                <strong>Sessions:</strong>{" "}
                                                {p.sessionsDone ?? 0} / {p.sessionsPlanned ?? 0}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {p.sessionsPlanned > 0 && (
                                            <div
                                                style={{
                                                    height: 8,
                                                    width: "100%",
                                                    background: "#eee",
                                                    borderRadius: 8,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        height: "100%",
                                                        width: `${((p.sessionsDone ?? 0) / p.sessionsPlanned) * 100}%`,
                                                        background: "linear-gradient(90deg, #4f8cff, #38bdf8)",
                                                        transition: "width 0.3s ease",
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {p.workflowInstanceId && (
                                            <div style={{ marginTop: 12 }}>
                                                <JourneyTimeline activeKey={getJourneyKeyFromStatus(p.status)} />
                                            </div>
                                        )}

                                        {/* Button */}
                                        <button
                                            onClick={() => openWorkflowForPatient(p.id)}
                                            disabled={patientsLoading}
                                            style={{
                                                ...styles.btnPrimary(patientsLoading),
                                                alignSelf: "flex-start",
                                            }}
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
                            <div style={{display: "grid", gap: 10}}>

                                {sortedTasks.map((t) => {
                                    const patient = patientByInstance.get(Number(t.instanceId));

                                    // ✅ compute once
                                    const displayName =
                                        t.patientName ||
                                        (patient ? (patient.fullName || `Patient #${patient.id}`) : null);

                                    return (
                                        <div
                                            key={t.id}
                                            style={{
                                                ...styles.card,
                                                background: "var(--surface)",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                                <div style={{ display: "grid" }}>
                                                    <div style={{ fontWeight: 950 }}>
                                                        {t.title || t.name || t.nodeId || `Task #${t.id}`}
                                                    </div>

                                                    <div style={styles.muted}>
                                                        {displayName ? (
                                                            <div style={{ marginBottom: 4 }}>
                                                                for: <strong>{displayName}</strong>
                                                            </div>
                                                        ) : (
                                                            <div style={{ marginBottom: 4, opacity: 0.85 }}>
                                                                for: <strong>Unknown patient</strong>
                                                            </div>
                                                        )}

                                                        instanceId: {t.instanceId} • nodeId: {t.nodeId} • status: {t.status}
                                                    </div>
                                                </div>

                                                <div style={{ display: "flex", gap: 8 }}>
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
                    setModalPrefill({});
                }}
                onSubmit={handleSubmit}
                prefillValues={modalPrefill}
            />
        </div>
    );
}
