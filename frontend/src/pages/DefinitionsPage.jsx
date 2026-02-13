import { useEffect, useState } from "react";
import { workflowApi } from "../workflow/api/workflowApi";

export default function DefinitionsPage() {
    const [definitions, setDefinitions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [name, setName] = useState("DE Physio Full Template");
    const [jsonText, setJsonText] = useState("");
    const [msg, setMsg] = useState("");

    const [businessKey, setBusinessKey] = useState("CASE-001");

    const reload = async () => {
        setLoading(true);
        setErr("");
        try {
            const defs = await workflowApi.listDefinitions();
            setDefinitions(defs || []);
        } catch (e) {
            setErr(String(e?.message || e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reload();
    }, []);

    const onCreate = async () => {
        setErr("");
        setMsg("");
        try {
            const definitionJson = JSON.parse(jsonText);
            const created = await workflowApi.createDefinition(name, definitionJson);
            setMsg(`Created definition id=${created.id}`);
            setJsonText("");
            await reload();
        } catch (e) {
            setErr(String(e?.message || e));
        }
    };

    // ✅ This will print templates in console if backend endpoint works
    useEffect(() => {
        workflowApi.getTemplates().then(console.log).catch((e) => console.error(e));
    }, []);

    const onDeploy = async (definitionId) => {
        setErr("");
        setMsg("");
        try {
            const dep = await workflowApi.deployDefinition(definitionId);
            setMsg(
                `Deployed definition ${definitionId} => deploymentId=${dep.id} version=${dep.version}`
            );
            await reload();
        } catch (e) {
            setErr(String(e?.message || e));
        }
    };

    const onStartInstance = async (deploymentId) => {
        setErr("");
        setMsg("");
        try {
            // ✅ FIX: pass an object as required by workflowApi.startInstance
            const inst = await workflowApi.startInstance({ deploymentId, businessKey });
            setMsg(
                `Started instance id=${inst.id} status=${inst.status} node=${inst.currentNodeId}`
            );
        } catch (e) {
            setErr(String(e?.message || e));
        }
    };

    return (
        <div style={{ display: "grid", gap: 14, color: "var(--text-main)" }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Workflow Definitions</div>

            {err ? <div style={styles.err}>{err}</div> : null}
            {msg ? <div style={styles.ok}>{msg}</div> : null}

            <div style={styles.card}>
                <div style={styles.cardTitle}>Create definition</div>

                <label style={styles.label}>Name</label>
                <input
                    style={styles.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <label style={styles.label}>Workflow JSON (meta/nodes/edges)</label>
                <textarea
                    style={styles.textarea}
                    rows={12}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder="Paste the workflow JSON here (the big object with meta/nodes/edges)"
                />

                <button style={styles.primary} onClick={onCreate} disabled={!jsonText.trim()}>
                    Create
                </button>
            </div>

            <div style={styles.card}>
                <div style={styles.cardTitle}>Existing definitions</div>

                <button style={styles.secondary} onClick={reload} disabled={loading}>
                    {loading ? "Loading..." : "Refresh"}
                </button>

                {definitions.length === 0 ? (
                    <div style={{ opacity: 0.8, marginTop: 10, color: "var(--text-muted)" }}>
                        No definitions found.
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                        {definitions.map((d) => (
                            <div key={d.id} style={styles.row}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 900 }}>{d.name}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                        id: {d.id} • createdAt: {d.createdAt}
                                    </div>
                                </div>

                                <button style={styles.secondary} onClick={() => onDeploy(d.id)}>
                                    Deploy
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={styles.card}>
                <div style={styles.cardTitle}>Start instance (after deploy)</div>

                <label style={styles.label}>Business key</label>
                <input
                    style={styles.input}
                    value={businessKey}
                    onChange={(e) => setBusinessKey(e.target.value)}
                />

                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                    After you deploy, copy the <b>deploymentId</b> from the green message and use it
                    here.
                </div>

                <StartInstanceQuick onStart={onStartInstance} />
            </div>
        </div>
    );
}

function StartInstanceQuick({ onStart }) {
    const [deploymentId, setDeploymentId] = useState("1");

    return (
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <input
                style={{ ...styles.input, width: 120 }}
                value={deploymentId}
                onChange={(e) => setDeploymentId(e.target.value)}
                placeholder="deploymentId"
            />
            <button
                style={styles.primary}
                onClick={() => onStart(Number(deploymentId))}
                disabled={!deploymentId.trim() || Number.isNaN(Number(deploymentId))}
            >
                Start instance
            </button>
        </div>
    );
}

const styles = {
    card: {
        padding: 14,
        borderRadius: 18,
        background: "var(--surface)",
        border: "1px solid var(--border-soft)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.06)", // neutral shadow is OK
    },
    cardTitle: { fontWeight: 900, marginBottom: 10, color: "var(--text-main)" },

    label: {
        display: "block",
        fontSize: 12,
        fontWeight: 800,
        marginTop: 10,
        marginBottom: 6,
        color: "var(--text-muted)",
    },

    input: {
        width: "100%",
        padding: 10,
        borderRadius: 12,
        border: "1px solid var(--border-soft)",
        background: "var(--surface)",
        color: "var(--text-main)",
        outline: "none",
        boxSizing: "border-box",
    },

    textarea: {
        width: "100%",
        padding: 10,
        borderRadius: 12,
        border: "1px solid var(--border-soft)",
        background: "var(--surface)",
        color: "var(--text-main)",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },

    row: {
        display: "flex",
        gap: 10,
        padding: 12,
        borderRadius: 16,
        border: "1px solid var(--border-soft)",
        background: "var(--row-bg, rgba(127,127,127,0.06))",
        alignItems: "center",
    },

    primary: {
        border: "none",
        padding: "10px 12px",
        borderRadius: 14,
        fontWeight: 900,
        cursor: "pointer",
        background: "var(--btn-primary-bg)",
        color: "var(--btn-primary-text)",
        height: 42,
        whiteSpace: "nowrap",
        marginTop: 10,
    },

    secondary: {
        border: "1px solid var(--btn-secondary-border)",
        padding: "10px 12px",
        borderRadius: 14,
        fontWeight: 900,
        cursor: "pointer",
        background: "var(--btn-secondary-bg)",
        color: "var(--btn-secondary-text)",
        height: 42,
        whiteSpace: "nowrap",
    },

    err: {
        padding: 12,
        borderRadius: 16,
        background: "var(--danger-bg)",
        border: "1px solid var(--danger-border)",
        color: "var(--danger-text)",
        fontWeight: 700,
        whiteSpace: "pre-wrap",
    },

    ok: {
        padding: 12,
        borderRadius: 16,
        background: "var(--success-bg, rgba(220,252,231,0.9))",
        border: "1px solid var(--success-border, rgba(34,197,94,0.25))",
        color: "var(--success-text, #14532d)",
        fontWeight: 800,
        whiteSpace: "pre-wrap",
    },
};
