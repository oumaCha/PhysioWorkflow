const steps = [
    { key: "referral", label: "Referral" },
    { key: "consult1", label: "1st consult" },
    { key: "treatment", label: "Treatment" },
    { key: "consultLast", label: "Last consult" },
];

export default function JourneyTimeline({ activeKey }) {
    return (
        <div style={styles.wrap}>
            {steps.map((s, idx) => {
                const active = s.key === activeKey;
                const done = steps.findIndex(x => x.key === activeKey) > idx;

                return (
                    <div key={s.key} style={styles.step}>
                        <div style={{ ...styles.dot, ...(active ? styles.dotActive : done ? styles.dotDone : {}) }} />
                        <div style={{ ...styles.label, ...(active ? styles.labelActive : done ? styles.labelDone : {}) }}>
                            {s.label}
                        </div>
                        {idx < steps.length - 1 && (
                            <div style={{ ...styles.line, ...(done ? styles.lineDone : {}) }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const styles = {
    wrap: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 14,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        overflowX: "auto",
    },
    step: { display: "flex", alignItems: "center", gap: 10, position: "relative" },
    dot: {
        width: 12, height: 12, borderRadius: 999,
        background: "rgba(15,23,42,0.20)",
    },
    dotActive: { background: "#0284c7", transform: "scale(1.2)" },
    dotDone: { background: "#0f766e" },

    label: { fontWeight: 800, fontSize: 13, color: "rgba(15,23,42,0.65)", whiteSpace: "nowrap" },
    labelActive: { color: "#0f172a" },
    labelDone: { color: "#0f172a" },

    line: { width: 36, height: 2, background: "rgba(15,23,42,0.12)" },
    lineDone: { background: "rgba(15,118,110,0.7)" },
};
