import PhysioDashboard from "./PhysioDashboard";
import ReceptionDashboard from "./ReceptionDashboard";

export default function DashboardPage({ role, auth, onOpenTask, onOpenInstance }) {
    if (role === "RECEPTION") {
        return <ReceptionDashboard auth={auth} />;
    }

    return <PhysioDashboard auth={auth} onOpenTask={onOpenTask} onOpenInstance={onOpenInstance} />;
}
