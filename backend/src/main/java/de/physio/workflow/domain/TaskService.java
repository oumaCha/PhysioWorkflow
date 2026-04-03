package de.physio.workflow.domain;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import de.physio.workflow.persistence.entity.PatientEntity;
import de.physio.workflow.persistence.repository.PatientRepository;
import de.physio.workflow.workflowengine.model.WorkflowPhaseMapper;
import de.physio.workflow.persistence.entity.TaskEntity;
import de.physio.workflow.persistence.entity.WorkflowDeploymentEntity;
import de.physio.workflow.persistence.entity.WorkflowInstanceEntity;
import de.physio.workflow.persistence.repository.TaskRepository;
import de.physio.workflow.persistence.repository.WorkflowDeploymentRepository;
import de.physio.workflow.persistence.repository.WorkflowInstanceRepository;
import de.physio.workflow.security.SecurityUtil;
import de.physio.workflow.workflowengine.model.WorkflowEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.OffsetDateTime;

@Service
public class TaskService {

    private final TaskRepository taskRepo;
    private final WorkflowInstanceRepository instanceRepo;
    private final WorkflowDeploymentRepository deploymentRepo;
    private final WorkflowEngine engine;
    private final ObjectMapper om;
    private final PatientRepository patientRepo;

    public TaskService(TaskRepository taskRepo,
                       WorkflowInstanceRepository instanceRepo,
                       WorkflowDeploymentRepository deploymentRepo,
                       WorkflowEngine engine,
                       ObjectMapper om,
                       PatientRepository patientRepo) {
        this.taskRepo = taskRepo;
        this.instanceRepo = instanceRepo;
        this.deploymentRepo = deploymentRepo;
        this.engine = engine;
        this.om = om;
        this.patientRepo = patientRepo;
    }

    public List<TaskEntity> findOpenTasks() {
        return taskRepo.findByStatusOrderByCreatedAtAsc("OPEN");
    }

    @Transactional
    public TaskEntity complete(Long taskId, JsonNode formData) {
        TaskEntity task = taskRepo.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        // Role check
        String role = SecurityUtil.currentRole();

        String actorRole = task.getActorRole().toUpperCase();
        String needed;

        switch (actorRole) {
            case "PHYSIO":
                needed = "ROLE_PHYSIOTHERAPIST";
                break;
            case "RECEPTION":
                needed = "ROLE_RECEPTIONIST";
                break;
            case "ADMIN":
                needed = "ROLE_ADMIN";
                break;
            case "PATIENT":
                needed = "ROLE_PATIENT";
                break;
            default:
                needed = "ROLE_" + actorRole;
        }

        if (role == null || !role.equals(needed)) {
            throw new IllegalArgumentException(
                    "Forbidden: your role " + role + " cannot complete task requiring " + needed
            );
        }

        if (!"OPEN".equalsIgnoreCase(task.getStatus())) {
            throw new IllegalArgumentException("Task is not OPEN: " + taskId);
        }

        WorkflowInstanceEntity inst = instanceRepo.findById(task.getInstanceId())
                .orElseThrow(() -> new IllegalArgumentException("Instance not found: " + task.getInstanceId()));

        WorkflowDeploymentEntity dep = deploymentRepo.findById(inst.getDeploymentId())
                .orElseThrow(() -> new IllegalArgumentException("Deployment not found: " + inst.getDeploymentId()));

        // --- session counting / patient progress ---
        // Rules:
        // - Completing t_plan counts as the first consultation (sessionsDone becomes at least 1)
        // - Completing t_session increments sessionsDone and forces sessionNumber to be sequential
        PatientEntity patient = patientRepo.findByWorkflowInstanceId(inst.getId()).orElse(null);

        JsonNode finalFormData = formData;
        if (patient != null) {
            finalFormData = applySessionProgressRules(task.getNodeId(), patient, formData);
            patientRepo.save(patient);
        }

        // 1) store task form data on task record
        task.setFormData(finalFormData);
        task.setStatus("COMPLETED");
        task.setCompletedAt(OffsetDateTime.now());
        taskRepo.save(task);

        // 2) merge into instance contextJson under contextKey
        ObjectNode ctx = (inst.getContextJson() != null && inst.getContextJson().isObject())
                ? (ObjectNode) inst.getContextJson()
                : om.createObjectNode();

        String key = task.getContextKey();
        if (key != null && !key.isBlank()) {
            ctx.set(key, finalFormData == null ? om.createObjectNode() : finalFormData);
        }

        inst.setContextJson(ctx);
        inst.setStatus("RUNNING");
        inst.setUpdatedAt(OffsetDateTime.now());

        engine.advanceAfterTask(inst, dep.getDefinitionJson());

        // update patient.status based on NEW active node
        String newNodeId = inst.getCurrentNodeId();
        String newPhase = WorkflowPhaseMapper.toPhase(newNodeId);

        patientRepo.findByWorkflowInstanceId(inst.getId()).ifPresent(p -> {
            p.setStatus(newPhase);
            patientRepo.save(p);
        });

        return task;
    }

    /**
     * Mutates patient.sessionsPlanned / patient.sessionsDone and (for t_session) returns a formData
     * where sessionNumber is forced to the next sequential value.
     */
    private JsonNode applySessionProgressRules(String nodeId, PatientEntity patient, JsonNode formData) {
        if (nodeId == null) return formData;

        ObjectNode data = (formData != null && formData.isObject())
                ? (ObjectNode) formData.deepCopy()
                : om.createObjectNode();

        switch (nodeId) {

            case "t_intake": {
                if (patient.getSessionsDone() < 1) patient.setSessionsDone(1);
                return data;
            }

            case "t_plan": {
                // plannedSessions from the form -> patient.sessionsPlanned
                JsonNode planned = data.get("plannedSessions");
                if (planned != null && planned.isNumber()) {
                    patient.setSessionsPlanned(planned.asInt());
                }

                // First consultation counts as 1 session
                if (patient.getSessionsDone() < 1) {
                    patient.setSessionsDone(1);
                }
                return data;
            }

            case "t_session": {
                int planned = patient.getSessionsPlanned();
                if (planned > 1) {
                    patient.setSessionsDone(Math.max(patient.getSessionsDone(), planned - 1)); // -> 6
                    data.put("sessionNumber", planned - 1); // keeps form consistent
                } else {
                    patient.setSessionsDone(Math.max(patient.getSessionsDone(), 1));
                    data.put("sessionNumber", patient.getSessionsDone());
                }
                return data;
            }

            case "t_outcome": {
                // Last consultation counts as the final planned session (e.g., 7/7)
                int planned = patient.getSessionsPlanned();
                if (planned > 0) {
                    patient.setSessionsDone(Math.max(patient.getSessionsDone(), planned));
                }
                return data;
            }

            default:
                return formData;
        }
    }
}