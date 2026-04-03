// src/workflow/api/workflowApi.js
import { apiFetch } from "./http";


export function openReceptionPatientWorkflow(patientId) {
    return apiFetch(`/api/reception/patients/${patientId}/open-workflow`, {
        method: "POST",
    });
}

export function confirmReceptionPaymentAndClose(patientId) {
    return apiFetch(`/api/reception/patients/${patientId}/confirm-payment-and-close`, {
        method: "POST",
    });
}
export const workflowApi = {
    // -------------------------
    // Reception
    // -------------------------
    listReceptionPatients: () =>
        apiFetch("/api/reception/patients"),

    createReceptionPatient: (payload) =>
        apiFetch("/api/reception/patients", {
            method: "POST",
            body: payload,
        }),

    // -------------------------
    // Physio patients
    // -------------------------
    listPhysioPatients: () =>
        apiFetch("/api/physio/patients"),

    openPatientWorkflow: (patientId) =>
        apiFetch(`/api/physio/patients/${patientId}/open-workflow`, {
            method: "POST",
        }),



    listAdminPatients: () => apiFetch("/api/admin/patients"),

    createUser: ({ username, password, role }) =>
        apiFetch("/api/admin/users", {
            method: "POST",
            body: { username, password, role },
        }),

    /** ✅ ADD THIS **/
    listAdminUsers: () => apiFetch("/api/admin/users"),



    // -------------------------
    // Instances (Canvas)
    // -------------------------
    getInstance: (instanceId) =>
        apiFetch(`/api/workflow-instances/${instanceId}`),


    listInstanceTasks: (instanceId) =>
        apiFetch(`/api/workflow-instances/${instanceId}/tasks`),

    jumpToNode: (instanceId, nodeId) =>
        apiFetch(`/api/workflow-instances/${instanceId}/jump/${encodeURIComponent(nodeId)}`, {
            method: "POST",
        }),

    // -------------------------
    // Definitions
    // -------------------------
    getDefinition: (definitionId) =>
        apiFetch(`/api/workflow-definitions/${definitionId}`),

    updateDefinition: (definitionId, payload) =>
        apiFetch(`/api/workflow-definitions/${definitionId}`, {
            method: "PUT",
            body: payload,
        }),

    // -------------------------
    // Layout
    // -------------------------
    getLayout: (instanceId) =>
        apiFetch(`/api/workflow-instances/${instanceId}/layout`),

    saveLayout: (instanceId, layout) =>
        apiFetch(`/api/workflow-instances/${instanceId}/layout`, {
            method: "PUT",
            body: layout,
        }),

    // -------------------------
    // Tasks
    // -------------------------
    listTasks: (status = "OPEN") =>
        apiFetch(`/api/tasks-with-patient?status=${encodeURIComponent(status)}`),

    getTask: (taskId) =>
        apiFetch(`/api/tasks/${taskId}`),

// completeTask: (taskId, values) =>
        // apiFetch(`/api/tasks/${taskId}/complete`, {
           // method: "POST",
           // body: { data: values },
        // }),

    completeTask: (taskId, values) =>
        apiFetch(`/api/tasks/${taskId}/complete`, {
            method: "POST",
            body: { data: values ?? {} },
        }),



    // -------------------------
    // Overlay
    // -------------------------
    getOverlay: (instanceId) =>
        apiFetch(`/api/workflow-instances/${instanceId}/overlay`),

    saveOverlay: (instanceId, overlay) =>
        apiFetch(`/api/workflow-instances/${instanceId}/overlay`, {
            method: "PUT",
            body: overlay,
        }),



    // --- add inside workflowApi ---
    deployDefinition: (definitionId) =>
        apiFetch(`/api/workflow-definitions/${definitionId}/deploy`, {
            method: "POST",
        }),

    startInstance: ({ deploymentId, businessKey }) =>
        apiFetch(`/api/workflow-instances`, {
            method: "POST",
            body: { deploymentId, businessKey },
        }),

    confirmReceptionPaymentAndClose: (patientId) =>
        apiFetch(`/api/reception/patients/${patientId}/confirm-payment-and-close`, {
            method: "POST",
        }),


};


