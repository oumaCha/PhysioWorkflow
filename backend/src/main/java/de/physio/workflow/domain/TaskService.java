package de.physio.workflow.domain;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

    public TaskService(TaskRepository taskRepo,
                       WorkflowInstanceRepository instanceRepo,
                       WorkflowDeploymentRepository deploymentRepo,
                       WorkflowEngine engine,
                       ObjectMapper om) {
        this.taskRepo = taskRepo;
        this.instanceRepo = instanceRepo;
        this.deploymentRepo = deploymentRepo;
        this.engine = engine;
        this.om = om;
    }

    public List<TaskEntity> findOpenTasks() {
        return taskRepo.findByStatusOrderByCreatedAtAsc("OPEN");
    }

    @Transactional
    public TaskEntity complete(Long taskId, JsonNode formData) {
        TaskEntity task = taskRepo.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        // Role check
        String role = SecurityUtil.currentRole(); // e.g. ROLE_PHYSIO
        String needed = "ROLE_" + task.getActorRole().toUpperCase();

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

        // 1) store task form data on task record
        task.setFormData(formData);
        task.setStatus("DONE");
        task.setCompletedAt(OffsetDateTime.now());
        taskRepo.save(task);

        // 2) merge into instance contextJson under contextKey
        ObjectNode ctx = (inst.getContextJson() != null && inst.getContextJson().isObject())
                ? (ObjectNode) inst.getContextJson()
                : om.createObjectNode();

        String key = task.getContextKey();
        if (key != null && !key.isBlank()) {
            ctx.set(key, formData == null ? om.createObjectNode() : formData);
        }

        inst.setContextJson(ctx);
        inst.setStatus("RUNNING");
        inst.setUpdatedAt(OffsetDateTime.now());

        // advance after task
        engine.advanceAfterTask(inst, dep.getDefinitionJson());

        return task;
    }


}

