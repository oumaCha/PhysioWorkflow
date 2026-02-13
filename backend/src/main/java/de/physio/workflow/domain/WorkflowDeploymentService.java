package de.physio.workflow.domain;

import de.physio.workflow.persistence.entity.WorkflowDeploymentEntity;
import de.physio.workflow.persistence.repository.WorkflowDefinitionRepository;
import de.physio.workflow.persistence.repository.WorkflowDeploymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkflowDeploymentService {

    private final WorkflowDefinitionRepository definitionRepository;
    private final WorkflowDeploymentRepository deploymentRepository;

    public WorkflowDeploymentService(WorkflowDefinitionRepository definitionRepository,
                                     WorkflowDeploymentRepository deploymentRepository) {
        this.definitionRepository = definitionRepository;
        this.deploymentRepository = deploymentRepository;
    }

    @Transactional
    public WorkflowDeploymentEntity deploy(Long definitionId) {
        var def = definitionRepository.findById(definitionId)
                .orElseThrow(() -> new IllegalArgumentException("Definition not found: " + definitionId));

        int nextVersion = deploymentRepository.findByDefinitionIdOrderByVersionDesc(definitionId)
                .stream().findFirst()
                .map(d -> d.getVersion() + 1)
                .orElse(1);

        WorkflowDeploymentEntity dep = new WorkflowDeploymentEntity();
        dep.setDefinitionId(definitionId);
        dep.setVersion(nextVersion);
        dep.setActive(true);
        dep.setDefinitionJson(def.getDefinitionJson());

        return deploymentRepository.save(dep);
    }

    public void ensureAtLeastOneDeploymentExists() {
        if (deploymentRepository.count() == 0) {

            var latestDef = definitionRepository
                    .findTopByOrderByIdDesc()
                    .orElseThrow(() ->
                            new IllegalStateException("No workflow definitions exist"));

            deploy(latestDef.getId());
        }
    }

}
