import { useMemo, useState, useEffect } from "react";
import AppLayout from "../layout/AppLayout";
import WorkflowCanvasPage from "../pages/WorkflowCanvasPage";
import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";

function roleFromMe(me) {
    const roles = me?.roles || [];
    if (roles.includes("ROLE_ADMIN")) return "ADMIN";
    if (roles.includes("ROLE_PHYSIOTHERAPIST")) return "PHYSIO";
    if (roles.includes("ROLE_RECEPTIONIST")) return "RECEPTION";
    return null;
}

export default function App() {
    const [tab, setTab] = useState("dashboard"); // dashboard | canvas
    const [session, setSession] = useState(null); // { username, role, me }

    const role = session?.role ?? null;
    const isPhysio = role === "PHYSIO";
    const isAdmin = role === "ADMIN";
    const isReception = role === "RECEPTION";

    const [selectedInstanceId, setSelectedInstanceId] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    // ✅ Restore login after refresh (cookie session)
    useEffect(() => {
        let cancelled = false;

        async function restore() {
            try {
                const res = await fetch("/api/auth/me", { credentials: "include" });
                if (!res.ok) {
                    if (!cancelled) setSession(null);
                    return;
                }

                const me = await res.json();
                const resolvedRole = roleFromMe(me);
                if (!resolvedRole) {
                    if (!cancelled) setSession(null);
                    return;
                }

                if (!cancelled) {
                    setSession({
                        username: me?.username ?? "user",
                        role: resolvedRole,
                        me,
                    });
                }
            } catch {
                if (!cancelled) setSession(null);
            }
        }

        restore();
        return () => {
            cancelled = true;
        };
    }, []);

    // Cleanup when role changes
    useEffect(() => {
        setTab("dashboard");
        setSelectedInstanceId(null);
        setSelectedTaskId(null);
    }, [role]);

    const headerTitle = useMemo(() => {
        if (tab === "dashboard") return "PhysioFlow";
        if (tab === "canvas") return "Workflow Canvas";
        return "PhysioFlow";
    }, [tab]);

    const headerSubtitle = useMemo(() => {
        if (tab === "dashboard") return isAdmin ? "Administration" : "Patients, tasks & progress";
        if (tab === "canvas") return "Plan & document the treatment path";
        return "";
    }, [tab, isAdmin]);

    const handleOpenTask = (task) => {
        if (!isPhysio) return;
        setSelectedInstanceId(task.instanceId);
        setSelectedTaskId(task.id);
        setTab("canvas");
    };

    const handleOpenInstance = (instanceId) => {
        if (!isPhysio) return;
        setSelectedInstanceId(instanceId);
        setSelectedTaskId(null);
        setTab("canvas");
    };

    // LoginPage calls /api/auth/login then /api/auth/me and passes {username, me}
    const handleLogin = ({ username, me }) => {
        const resolvedRole = roleFromMe(me);
        if (!resolvedRole) return;

        setSession({
            username: username?.trim?.() || me?.username || "user",
            role: resolvedRole,
            me,
        });
    };

    // ✅ Correct logout for Spring Security: POST /logout
    const handleLogout = async () => {
        try {
            await fetch("/logout", {
                method: "POST",
                credentials: "include",
            });
        } finally {
            setSession(null);
            setTab("dashboard");
            setSelectedInstanceId(null);
            setSelectedTaskId(null);
        }
    };

    if (!session) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <AppLayout
            title={headerTitle}
            subtitle={headerSubtitle}
            role={role}
            setRole={() => {}}
            tab={tab}
            setTab={setTab}
            isPhysio={isPhysio}
            onLogout={handleLogout}
            username={session.username}
        >
            {tab === "dashboard" && (
                <DashboardPage
                    role={role}
                    onOpenTask={isPhysio ? handleOpenTask : undefined}
                    onOpenInstance={isPhysio ? handleOpenInstance : undefined}
                />
            )}

            {tab === "canvas" && isPhysio && (
                <WorkflowCanvasPage
                    instanceId={selectedInstanceId}
                    taskId={selectedTaskId}
                    onBackToDashboard={() => setTab("dashboard")}
                />
            )}

            {isAdmin && tab === "canvas" && (
                <div style={{ padding: 24 }}>Admin currently has no canvas view. Go to Dashboard.</div>
            )}

            {isReception && tab === "canvas" && (
                <div style={{ padding: 24 }}>Reception role has no access to canvas.</div>
            )}
        </AppLayout>
    );
}


