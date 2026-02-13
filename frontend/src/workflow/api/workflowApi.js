// src/workflow/api/workflowApi.js
import { apiFetch } from "./http";

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

    // -------------------------
    // Instances (Canvas)
    // -------------------------
    getInstance: (instanceId) =>
        apiFetch(`/api/workflow-instances/${instanceId}`),

    listInstanceTasks: (instanceId) =>
        apiFetch(`/api/workflow-instances/${instanceId}/tasks`),

    // -------------------------
    // Definitions
    // -------------------------
    getDefinition: (definitionId) =>
        apiFetch(`/api/workflow-definitions/${definitionId}`),

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
        apiFetch(`/api/tasks?status=${encodeURIComponent(status)}`),

    getTask: (taskId) =>
        apiFetch(`/api/tasks/${taskId}`),

    completeTask: (taskId, values) =>
        apiFetch(`/api/tasks/${taskId}/complete`, {
            method: "POST",
            body: { data: values },
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
};
