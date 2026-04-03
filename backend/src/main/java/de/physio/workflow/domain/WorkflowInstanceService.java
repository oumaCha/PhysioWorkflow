package de.physio.workflow.domain;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.physio.workflow.persistence.entity.WorkflowDeploymentEntity;
import de.physio.workflow.persistence.entity.WorkflowInstanceEntity;
import de.physio.workflow.persistence.repository.WorkflowDeploymentRepository;
import de.physio.workflow.persistence.repository.WorkflowInstanceRepository;
import de.physio.workflow.workflowengine.model.WorkflowEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import de.physio.workflow.persistence.entity.TaskEntity;
import de.physio.workflow.persistence.repository.TaskRepository;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class WorkflowInstanceService {

    // private final WorkflowDeploymentRepository deploymentRepository;
    //  private final WorkflowInstanceRepository instanceRepository;
    // private final WorkflowEngine engine;
    // private final ObjectMapper objectMapper;

    private final WorkflowDeploymentRepository deploymentRepository;
    private final WorkflowInstanceRepository instanceRepository;
    private final TaskRepository taskRepository; //  add
    private final WorkflowEngine engine;
    private final ObjectMapper objectMapper;

    public WorkflowInstanceService(WorkflowDeploymentRepository deploymentRepository,
                                   WorkflowInstanceRepository instanceRepository,
                                   TaskRepository taskRepository,
                                   WorkflowEngine engine,
                                   ObjectMapper objectMapper) {
        this.deploymentRepository = deploymentRepository;
        this.instanceRepository = instanceRepository;
        this.taskRepository = taskRepository;
        this.engine = engine;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public WorkflowInstanceEntity start(Long deploymentId, String businessKey) {
        var dep = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new IllegalArgumentException("Deployment not found: " + deploymentId));

        WorkflowInstanceEntity inst = new WorkflowInstanceEntity();
        inst.setDefinitionId(dep.getDefinitionId());      // keep old column filled
        inst.setDeploymentId(dep.getId());
        inst.setStatus("RUNNING");

        // === IMPORTANT FIX ===
        inst.setContextJson(objectMapper.createObjectNode());   // empty ctx at start
        inst.setOverlayJson(objectMapper.createObjectNode());   // ✅ MUST SET THIS (was missing!)

        inst = instanceRepository.save(inst);

        // Run until first TASK or END
        engine.runUntilWaitOrEnd(inst, dep.getDefinitionJson());

        return inst;
    }


    public WorkflowInstanceEntity get(Long id) {
        return instanceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Instance not found: " + id));
    }

    /**
     * Starts a workflow instance from the latest deployment.
     * This is what the Physio UI wants when opening a patient.
     */
    @Transactional
    public WorkflowInstanceEntity startLatest(String businessKey) {
        WorkflowDeploymentEntity latest = deploymentRepository
                .findTopByOrderByIdDesc()
                .orElseThrow(() -> new IllegalStateException("No workflow deployment found. Deploy a workflow first."));
        return start(latest.getId(), businessKey);
    }

    /**
     * Convenience: start latest and return id.
     */
    @Transactional
    public Long startLatestId(String businessKey) {
        return startLatest(businessKey).getId();
    }

    @Transactional
    public WorkflowInstanceEntity jumpToNode(Long instanceId, String nodeId) {
        WorkflowInstanceEntity inst = instanceRepository.findById(instanceId)
                .orElseThrow(() -> new IllegalArgumentException("Instance not found: " + instanceId));

        var dep = deploymentRepository.findById(inst.getDeploymentId())
                .orElseThrow(() -> new IllegalArgumentException("Deployment not found: " + inst.getDeploymentId()));

        // 1) Cancel existing OPEN tasks for this instance so dashboard doesn't stay stuck
        List<TaskEntity> openTasks =
                taskRepository.findByInstanceIdAndStatusOrderByCreatedAtAsc(instanceId, "OPEN");

        OffsetDateTime now = OffsetDateTime.now();
        for (TaskEntity t : openTasks) {
            t.setStatus("CANCELLED");
            t.setCompletedAt(now);
        }
        taskRepository.saveAll(openTasks);

        // 2) Jump instance to the requested node
        inst.setCurrentNodeId(nodeId);
        inst.setStatus("RUNNING");
        inst.setUpdatedAt(now);
        instanceRepository.save(inst);

        // 3) Let engine create the correct new OPEN task from there
        engine.runUntilWaitOrEnd(inst, dep.getDefinitionJson());

        return inst;
    }
}

