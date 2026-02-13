package de.physio.workflow.domain;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.physio.workflow.persistence.entity.WorkflowDeploymentEntity;
import de.physio.workflow.persistence.entity.WorkflowInstanceEntity;
import de.physio.workflow.persistence.repository.WorkflowDeploymentRepository;
import de.physio.workflow.persistence.repository.WorkflowInstanceRepository;
import de.physio.workflow.workflowengine.model.WorkflowEngine;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkflowInstanceService {

    private final WorkflowDeploymentRepository deploymentRepository;
    private final WorkflowInstanceRepository instanceRepository;
    private final WorkflowEngine engine;
    private final ObjectMapper objectMapper;

    public WorkflowInstanceService(WorkflowDeploymentRepository deploymentRepository,
                                   WorkflowInstanceRepository instanceRepository,
                                   WorkflowEngine engine,
                                   ObjectMapper objectMapper) {
        this.deploymentRepository = deploymentRepository;
        this.instanceRepository = instanceRepository;
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
}

