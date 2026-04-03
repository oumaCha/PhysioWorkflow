import PhysioDashboard from "./PhysioDashboard";
import ReceptionDashboard from "./ReceptionDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardPage({ role, auth, onOpenTask, onOpenInstance }) {
    // receptionist
    if (role === "RECEPTION" || role === "RECEPTIONIST") {
        return <ReceptionDashboard auth={auth} />;
    }

    // admin
    if (role === "ADMIN") {
        return <AdminDashboard auth={auth} />;
    }

    // physio (default)
    return <PhysioDashboard auth={auth} onOpenTask={onOpenTask} onOpenInstance={onOpenInstance} />;
}