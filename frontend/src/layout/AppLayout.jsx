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
        </div>
    );
}
