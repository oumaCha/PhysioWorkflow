package de.physio.workflow.workflowengine.model;

public final class WorkflowPhaseMapper {
    private WorkflowPhaseMapper() {}

    public static String toPhase(String nodeId) {
        if (nodeId == null || nodeId.isBlank()) return "UNKNOWN";

        // Admin/referral steps
        if (nodeId.equals("t_prescription_check")) return "PRESCRIPTION_CHECK";
        if (nodeId.equals("t_deadline_check")) return "DEADLINE_CHECK";
        if (nodeId.equals("t_copay_check")) return "COPAY_CHECK";

        // First consult block
        if (nodeId.equals("t_intake")) return "FIRST_CONSULTATION";
        if (nodeId.equals("t_consent")) return "CONSENT";
        if (nodeId.equals("t_assessment")) return "ASSESSMENT";
        if (nodeId.equals("t_pain_first_consult")) return "PAIN_DECISION_FIRST";

        if (nodeId.equals("t_refer_doctor_early")) return "DOCTOR_REFERRAL_EARLY";
        if (nodeId.equals("t_plan")) return "TREATMENT_PLANNING";
        if (nodeId.equals("t_schedule")) return "SCHEDULING";

        // Treatment loop
        if (nodeId.equals("t_session")) return "TREATMENT";
        if (nodeId.equals("t_home_program")) return "HOME_PROGRAM";

        // Outcome/admin end
        if (nodeId.equals("t_outcome")) return "OUTCOME";
        if (nodeId.equals("t_pain_outcome")) return "PAIN_DECISION_OUTCOME";
        if (nodeId.equals("t_refer_doctor_outcome")) return "DOCTOR_REFERRAL_OUTCOME";
        if (nodeId.equals("t_report")) return "REPORT";
        if (nodeId.equals("t_billing")) return "BILLING";
        if (nodeId.equals("t_close_case")) return "CLOSED";

        // End
        if (nodeId.equals("end")) return "CLOSED";

        // Decision nodes
        if (nodeId.startsWith("x_")) return "DECISION";

        return "IN_PROGRESS";
    }
}