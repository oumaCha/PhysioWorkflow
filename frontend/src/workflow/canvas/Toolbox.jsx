import React, { useMemo, useState } from "react";
import "../../styles/workflow.css";

const TOOL_GROUPS = [
    {
        title: "Core workflow",
        description: "Generic building blocks",
        items: [
            { key: "start", label: "Start", kind: "START", role: "SYSTEM", icon: "▶️", subtitle: "Entry point" },
            { key: "task", label: "Task", kind: "TASK", role: "SYSTEM", icon: "🧩", subtitle: "Single activity" },
            { key: "xor", label: "Decision (XOR)", kind: "DECISION", role: "SYSTEM", icon: "🔀", subtitle: "Branch by condition" },
            { key: "end", label: "End", kind: "END", role: "SYSTEM", icon: "⏹️", subtitle: "Exit point" },
            { key: "timer", label: "Timer / Wait", kind: "TIMER", role: "SYSTEM", icon: "⏱️", subtitle: "Delay / reminder" },
        ],
    },
    {
        title: "Patient & intake",
        description: "Erstkontakt, Anamnese, Consent",
        items: [
            { key: "patient", label: "Patient", kind: "ACTOR", role: "PATIENT", icon: "🧑‍🦽", subtitle: "Actor / participant" },
            { key: "intake", label: "First consultation (Erstaufnahme)", kind: "TASK", role: "PHYSIO", icon: "📝", subtitle: "Anamnese + baseline" },
            { key: "consent", label: "Consent / Datenschutz (DSGVO)", kind: "TASK", role: "PATIENT", icon: "🛡️", subtitle: "Consent & signature" },
            { key: "insurance", label: "Insurance check", kind: "TASK", role: "ADMIN", icon: "🏥", subtitle: "Kasse / status" },
        ],
    },
    {
        title: "Clinical assessment",
        description: "Befund, Tests, Red Flags",
        items: [
            { key: "assessment", label: "Assessment (Befund)", kind: "TASK", role: "PHYSIO", icon: "🩺", subtitle: "Clinical findings" },
            { key: "pain", label: "Pain score (0–10)", kind: "TASK", role: "PHYSIO", icon: "📈", subtitle: "NRS/VAS" },
            { key: "rom", label: "ROM / Mobility", kind: "TASK", role: "PHYSIO", icon: "📐", subtitle: "Range of motion" },
            { key: "redflags", label: "Red flags screening", kind: "TASK", role: "PHYSIO", icon: "⚠️", subtitle: "Safety check" },
            { key: "refer", label: "Refer to doctor", kind: "TASK", role: "PHYSIO", icon: "🧑‍⚕️", subtitle: "Arztkontakt" },
        ],
    },
    {
        title: "Treatment plan & sessions",
        description: "Plan, Heilmittel, Termine",
        items: [
            { key: "plan", label: "Treatment plan", kind: "TASK", role: "PHYSIO", icon: "🗺️", subtitle: "Based on prescription" },
            { key: "prescription", label: "Prescription check (Heilmittel)", kind: "TASK", role: "ADMIN", icon: "📄", subtitle: "Validity / sessions" },
            { key: "schedule", label: "Schedule appointment", kind: "TASK", role: "ADMIN", icon: "📅", subtitle: "Terminplanung" },
            { key: "session", label: "Treatment session", kind: "TASK", role: "PHYSIO", icon: "💪", subtitle: "Documentation + progress" },
            { key: "noshow", label: "No-show handling", kind: "TASK", role: "ADMIN", icon: "📞", subtitle: "Reschedule / contact" },
        ],
    },
    {
        title: "Therapy modules (Germany)",
        description: "KG, MT, MLD, KGG, etc.",
        items: [
            { key: "kg", label: "KG (Krankengymnastik)", kind: "TASK", role: "PHYSIO", icon: "🏃", subtitle: "Exercise therapy" },
            { key: "mt", label: "MT (Manuelle Therapie)", kind: "TASK", role: "PHYSIO", icon: "👐", subtitle: "Manual techniques" },
            { key: "mld", label: "MLD (Lymphdrainage)", kind: "TASK", role: "PHYSIO", icon: "💧", subtitle: "Lymph treatment" },
            { key: "kgg", label: "KGG (Trainingstherapie)", kind: "TASK", role: "PHYSIO", icon: "🏋️", subtitle: "Medical training" },
            { key: "heatcold", label: "Heat / Cold Therapy", kind: "TASK", role: "PHYSIO", icon: "🔥", subtitle: "Thermotherapy" },
        ],
    },
    {
        title: "Outcome & documentation",
        description: "Abschluss, Bericht, Abrechnung",
        items: [
            { key: "outcome", label: "Outcome / discharge", kind: "TASK", role: "PHYSIO", icon: "✅", subtitle: "Evaluation & summary" },
            { key: "report", label: "Generate report", kind: "TASK", role: "PHYSIO", icon: "🧾", subtitle: "Verlaufs-/Befundbericht" },
            { key: "billing", label: "Billing (Abrechnung)", kind: "TASK", role: "ADMIN", icon: "💳", subtitle: "Heilmittelkatalog" },
        ],
    },
];

function normalize(s) {
    return (s || "").toLowerCase();
}

function DraggableCard({ tool, onAdd }) {
    return (
        <button
            type="button"
            className="tb-card"
            data-role={tool.role}
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("application/x-workflow-tool", JSON.stringify(tool));
                e.dataTransfer.effectAllowed = "move";
                try {
                    const el = document.createElement("div");
                    el.style.position = "absolute";
                    el.style.top = "-9999px";
                    el.style.left = "-9999px";
                    el.style.padding = "10px 12px";
                    el.style.borderRadius = "14px";
                    el.style.background = "white";
                    el.style.boxShadow = "0 12px 30px rgba(0,0,0,0.18)";
                    el.style.border = "1px solid rgba(15,23,42,0.12)";
                    el.style.fontWeight = "900";
                    el.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
                    el.textContent = `${tool.icon || "🧩"} ${tool.label}`;
                    document.body.appendChild(el);
                    e.dataTransfer.setDragImage(el, 12, 12);
                    setTimeout(() => el.remove(), 0);
                } catch (_) {}
            }}
            onClick={() => onAdd?.(tool)}
        >
            <div className="tb-ic">{tool.icon}</div>

            <div className="tb-cardText">
                <div className="tb-titleRow">
                    <div className="tb-title">{tool.label}</div>
                    <span className={`tb-pill tb-pill--${normalize(tool.role)}`}>{tool.role}</span>
                </div>
                {tool.subtitle ? <div className="tb-subtitle">{tool.subtitle}</div> : null}
            </div>

            <div className="tb-grip" aria-hidden>
                ⋮⋮
            </div>
        </button>
    );
}

export default function Toolbox({ onAdd }) {
    const [q, setQ] = useState("");
    const [collapsed, setCollapsed] = useState(false);
    const [open, setOpen] = useState(() => {
        const o = {};
        for (const g of TOOL_GROUPS) o[g.title] = true;
        return o;
    });

    const filteredGroups = useMemo(() => {
        const query = normalize(q).trim();
        if (!query) return TOOL_GROUPS;

        return TOOL_GROUPS
            .map((g) => {
                const items = g.items.filter((t) => {
                    const hay = normalize(`${t.label} ${t.role} ${t.subtitle || ""} ${t.key || ""}`);
                    return hay.includes(query);
                });
                return { ...g, items };
            })
            .filter((g) => g.items.length > 0);
    }, [q]);

    return (
        <aside className={`tb ${collapsed ? "tb--collapsed" : ""}`}>
            <div className="tb-header">
                <div>
                    <div className="tb-hTitle">Physio Toolbox</div>
                    <div className="tb-hSub">Drag nodes into the canvas</div>
                </div>

                <button
                    type="button"
                    className="tb-iconBtn"
                    onClick={() => setCollapsed((v) => !v)}
                    title={collapsed ? "Expand" : "Collapse"}
                    aria-label={collapsed ? "Expand toolbox" : "Collapse toolbox"}
                >
                    {collapsed ? "➡️" : "⬅️"}
                </button>
            </div>

            <div className="tb-searchWrap">
                <input
                    className="tb-search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search tools… (e.g. assessment, consent, billing)"
                />
            </div>

            <div className="tb-body">
                {filteredGroups.map((g) => (
                    <section key={g.title} className="tb-group">
                        <button
                            type="button"
                            className="tb-groupHeader"
                            onClick={() => setOpen((s) => ({ ...s, [g.title]: !s[g.title] }))}
                        >
                            <div>
                                <div className="tb-groupTitle">{g.title}</div>
                                <div className="tb-groupDesc">{g.description}</div>
                            </div>
                            <div className={`tb-chevron ${open[g.title] ? "tb-chevron--open" : ""}`}>⌄</div>
                        </button>

                        <div className={`tb-groupItems ${open[g.title] ? "tb-groupItems--open" : ""}`}>
                            {g.items.map((t) => (
                                <DraggableCard key={t.key || t.label} tool={t} onAdd={onAdd} />
                            ))}
                        </div>
                    </section>
                ))}

                {filteredGroups.length === 0 ? (
                    <div className="tb-empty">
                        <div className="tb-emptyTitle">No matches</div>
                        <div className="tb-emptySub">Try a different keyword.</div>
                    </div>
                ) : null}
            </div>
        </aside>
    );
}
