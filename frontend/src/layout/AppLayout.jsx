import Header from "./Header";
import Footer from "./Footer";

export default function AppLayout({
                                      title,
                                      subtitle,
                                      role,
                                      tab,
                                      setTab,
                                      isPhysio,
                                      onLogout,
                                      username,
                                      loading,
                                      children,
                                  }) {
    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-main)", width: "100%" }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
                <Header
                    title={title}
                    subtitle={subtitle}
                    role={role}
                    tab={tab}
                    setTab={setTab}
                    isPhysio={isPhysio}
                    username={username}
                    onLogout={onLogout}
                />

                <main style={{ width: "100%", padding: "clamp(12px, 2vw, 24px)", boxSizing: "border-box" }}>
                    {children}
                </main>

                <Footer />
            </div>

            {loading && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(255,255,255,0.35)",
                        backdropFilter: "blur(3px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        pointerEvents: "all",
                    }}
                >
                    <div
                        style={{
                            padding: 16,
                            borderRadius: 14,
                            background: "rgba(255,255,255,0.85)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                            fontWeight: 600,
                        }}
                    >
                        Loading…
                    </div>
                </div>
            )}
        </div>
    );
}
