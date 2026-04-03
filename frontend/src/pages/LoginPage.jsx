import { useMemo, useState } from "react";
import { apiFetch } from "../workflow/api/http";


export default function LoginPage({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const canSubmit = useMemo(() => {
        return username.trim().length > 0 && password.length > 0 && !loading;
    }, [username, password, loading]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // ✅ ALWAYS fetch CSRF first
            await apiFetch("/api/auth/csrf");

            // login
            await apiFetch("/api/auth/login", {
                method: "POST",
                body: { username: username.trim(), password },
            });

            // load user
            const me = await apiFetch("/api/auth/me");

            onLogin({ username: username.trim(), me });

        } catch (err) {
            setError(err?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.bgGlow} />
            <div style={styles.shell}>
                <div style={styles.card}>
                    <div style={styles.brandRow}>
                        <div style={styles.logo}>PF</div>
                        <div>
                            <div style={styles.brandTitle}>PhysioFlow</div>
                            <div style={styles.brandSub}>Workflow modeling & execution</div>
                        </div>
                    </div>

                    <h1 style={styles.h1}>Sign in</h1>
                    <p style={styles.p}>Use your practice account to continue.</p>

                    {error && (
                        <div style={styles.errorBox} role="alert">
                            <strong style={{ display: "block", marginBottom: 4 }}>Login failed</strong>
                            <span style={{ opacity: 0.9 }}>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
                        <label style={styles.label}>Username</label>
                        <div style={styles.fieldWrap}>
                            <input
                                autoFocus
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your name"
                                style={styles.input}
                            />
                        </div>

                        <label style={{ ...styles.label, marginTop: 12 }}>Password</label>
                        <div style={styles.fieldWrap}>
                            <input
                                type={showPw ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                style={{ ...styles.input, paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw((v) => !v)}
                                style={styles.eyeBtn}
                                aria-label={showPw ? "Hide password" : "Show password"}
                                title={showPw ? "Hide password" : "Show password"}
                            >
                                {showPw ? "🙈" : "👁️"}
                            </button>
                        </div>

                        <button type="submit" disabled={!canSubmit} style={styles.primaryBtn}>
                            {loading ? "Signing in…" : "Sign in"}
                        </button>

                        <div style={styles.helpRow}>
              <span style={{ opacity: 0.8 }}>
                Demo users (from your backend init):{" "}
                  <code style={styles.code}>anna</code> / <code style={styles.code}>Physio123!</code>,{" "}
                  <code style={styles.code}>max</code> / <code style={styles.code}>Recep123!</code>,{" "}
                  <code style={styles.code}>becker</code> / <code style={styles.code}>Admin123!</code>
              </span>
                        </div>
                    </form>
                </div>

                <div style={styles.footerText}>
                    <span style={{ opacity: 0.75 }}>Germany • Physiotherapy treatment process workflows</span>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        width: "100%",
        display: "grid",
        placeItems: "center",
        padding: "24px 14px",
        background:
            "radial-gradient(1200px 600px at 20% 10%, rgba(99,102,241,0.18), transparent 50%), radial-gradient(900px 500px at 80% 20%, rgba(16,185,129,0.14), transparent 55%), #0b1020",
        color: "#0f172a",
        boxSizing: "border-box",
    },
    bgGlow: {
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        background: "radial-gradient(800px 400px at 50% 100%, rgba(255,255,255,0.10), transparent 60%)",
    },
    shell: {
        width: "min(960px, 100%)",
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 16,
        alignItems: "center",
        justifyItems: "center",
    },
    card: {
        width: "min(440px, 100%)",
        background: "rgba(255,255,255,0.94)",
        border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: 18,
        padding: "22px 20px",
        boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
        backdropFilter: "blur(10px)",
    },
    brandRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
    logo: {
        width: 44,
        height: 44,
        borderRadius: 14,
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        letterSpacing: 0.4,
        color: "white",
        background: "linear-gradient(135deg, rgba(99,102,241,1), rgba(16,185,129,1))",
        boxShadow: "0 10px 24px rgba(99,102,241,0.25)",
        userSelect: "none",
    },
    brandTitle: { fontWeight: 800, fontSize: 16, color: "#0f172a" },
    brandSub: { fontSize: 12, color: "rgba(15,23,42,0.65)" },
    h1: { margin: "6px 0 6px", fontSize: 26, letterSpacing: -0.4, color: "#0f172a" },
    p: { margin: 0, fontSize: 14, color: "rgba(15,23,42,0.70)" },
    errorBox: {
        marginTop: 14,
        padding: "12px 12px",
        borderRadius: 14,
        border: "1px solid rgba(239,68,68,0.25)",
        background: "rgba(239,68,68,0.08)",
        color: "#7f1d1d",
    },
    label: {
        display: "block",
        fontSize: 12,
        fontWeight: 700,
        color: "rgba(15,23,42,0.75)",
        marginBottom: 6,
    },
    fieldWrap: { position: "relative", display: "flex" },
    input: {
        width: "100%",
        padding: "12px 12px",
        borderRadius: 14,
        border: "1px solid rgba(15,23,42,0.15)",
        outline: "none",
        fontSize: 14,
    },
    eyeBtn: {
        position: "absolute",
        right: 8,
        top: 6,
        height: 32,
        width: 32,
        borderRadius: 10,
        border: "none",
        background: "rgba(15,23,42,0.06)",
        cursor: "pointer",
    },
    primaryBtn: {
        marginTop: 14,
        width: "100%",
        padding: "12px 12px",
        borderRadius: 14,
        border: "none",
        color: "white",
        fontWeight: 800,
        cursor: "pointer",
        background: "linear-gradient(135deg, rgba(99,102,241,1), rgba(16,185,129,1))",
        opacity: 1,
    },
    helpRow: { marginTop: 12, fontSize: 12 },
    code: { padding: "2px 6px", borderRadius: 8, background: "rgba(15,23,42,0.06)" },
    footerText: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
};
