package de.workflow.physio.backend.service;

import de.workflow.physio.backend.repo.WorkflowModelRepository;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.repository.Deployment;
import org.flowable.engine.repository.ProcessDefinition;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class DeploymentService {

  private final WorkflowModelRepository modelRepo;
  private final RepositoryService repositoryService;

  public DeploymentService(WorkflowModelRepository modelRepo, RepositoryService repositoryService) {
    this.modelRepo = modelRepo;
    this.repositoryService = repositoryService;
  }

  public DeployResult deployModel(String modelId) {
    var model = modelRepo.findById(modelId)
        .orElseThrow(() -> new IllegalArgumentException("Model not found: " + modelId));

    Deployment deployment = repositoryService.createDeployment()
        .name(model.getName())
        .addBytes(modelId + ".bpmn20.xml", model.getBpmnXml().getBytes(StandardCharsets.UTF_8))
        .deploy();

    ProcessDefinition pd = repositoryService.createProcessDefinitionQuery()
        .deploymentId(deployment.getId())
        .singleResult();

    if (pd == null) {
      throw new IllegalStateException("No process definition found after deploy (invalid BPMN?)");
    }

    return new DeployResult(deployment.getId(), pd.getId(), pd.getKey(), pd.getVersion());
  }

  public record DeployResult(String deploymentId, String processDefinitionId, String processKey, int version) {}
}

