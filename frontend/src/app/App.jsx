import { useMemo, useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";

import AppLayout from "../layout/AppLayout";
import WorkflowCanvasPage from "../pages/WorkflowCanvasPage";
import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import { apiFetch } from "../workflow/api/http";
import WorkflowDesignerPage from "../pages/WorkflowDesignerPage";

function roleFromMe(me) {
    const roles = Array.isArray(me?.roles) ? me.roles : [];
    if (roles.includes("ROLE_ADMIN")) return "ADMIN";
    if (roles.includes("ROLE_PHYSIOTHERAPIST")) return "PHYSIO";
    if (roles.includes("ROLE_RECEPTIONIST")) return "RECEPTION";
    return null;
}

function CanvasRouteWrapper({ isPhysio, session }) {
    const { instanceId, taskId } = useParams();

    // if user is not physio, block canvas route
    if (!isPhysio) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <WorkflowCanvasPage
            auth={session}
            instanceId={instanceId || null}
            taskId={taskId || null}
            onBackToDashboard={() => (window.location.href = "/dashboard")}
        />
    );
}

export default function App() {
    const navigate = useNavigate();
    const location = useLocation();

    const [session, setSession] = useState(null);
    const [restoring, setRestoring] = useState(true);

    const role = session?.role ?? null;
    const isPhysio = role === "PHYSIO";
    const isAdmin = role === "ADMIN";
    const isReception = role === "RECEPTION";

    // restore session from cookie
    useEffect(() => {
        let cancelled = false;

        async function restore() {
            try {
                await apiFetch("/api/auth/csrf").catch(() => {});
                const me = await apiFetch("/api/auth/me");

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
            } finally {
                if (!cancelled) setRestoring(false);
            }
        }

        void restore();
        return () => {
            cancelled = true;
        };
    }, []);

    const headerTitle = useMemo(() => {
        if (location.pathname.startsWith("/canvas")) return "Workflow Canvas";
        return "PhysioFlow";
    }, [location.pathname]);

    const headerSubtitle = useMemo(() => {
        if (location.pathname.startsWith("/canvas")) return "Plan & document the treatment path";
        return isAdmin ? "Administration" : "Patients, tasks & progress";
    }, [location.pathname, isAdmin]);

    function handleLogin({ username, me }) {
        const resolvedRole = roleFromMe(me);
        if (!resolvedRole) return;

        setSession({
            username: username?.trim?.() || me?.username || "user",
            role: resolvedRole,
            me,
        });

        // go back where user wanted to go, or dashboard
        navigate("/dashboard", { replace: true });
    }

    async function handleLogout() {
        try {
            await apiFetch("/api/auth/csrf");
            await apiFetch("/api/auth/logout", { method: "POST" });
        } catch (e) {
            console.error("Logout failed:", e);
        } finally {
            setSession(null);
            navigate("/login", { replace: true });
        }
    }

    // If not logged in: show login route, but keep SPA pathing clean
    if (!session && !restoring) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    // Logged in OR restoring: render layout, with mainLoading overlay
    return (
        <AppLayout
            title={headerTitle}
            subtitle={headerSubtitle}
            role={role}
            setRole={() => {}}
            tab={location.pathname.startsWith("/canvas") ? "canvas" : "dashboard"}
            setTab={(t) => navigate(t === "canvas" ? "/dashboard" : "/dashboard")}
            isPhysio={isPhysio}
            onLogout={handleLogout}
            username={session?.username ?? ""}
            mainLoading={restoring}
        >
            {/* Render routes only after session exists */}
            {session && (
                <Routes>
                    <Route
                        path="/dashboard"
                        element={
                            <DashboardPage
                                role={role}
                                onOpenTask={
                                    isPhysio
                                        ? (task) => navigate(`/canvas/${task.instanceId}/task/${task.id}`)
                                        : undefined
                                }
                                onOpenInstance={isPhysio ? (id) => navigate(`/canvas/${id}`) : undefined}
                            />
                        }
                    />

                    <Route
                        path="/canvas/:instanceId"
                        element={<CanvasRouteWrapper isPhysio={isPhysio} session={session} />}
                    />

                    <Route
                        path="/canvas/:instanceId/task/:taskId"
                        element={<CanvasRouteWrapper isPhysio={isPhysio} session={session} />}
                    />

                    <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    <Route
                        path="/designer/:definitionId"
                        element={<WorkflowDesignerPage isPhysio={isPhysio} />}
                    />
                </Routes>
            )}

            {/* While restoring and no session yet, keep main area stable */}
            {!session && restoring && <div style={{ minHeight: 300 }} />}
        </AppLayout>
    );
}
