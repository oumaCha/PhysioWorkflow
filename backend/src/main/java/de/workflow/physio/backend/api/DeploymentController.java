package de.workflow.physio.backend.api;

import de.workflow.physio.backend.service.DeploymentService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deployments")
public class DeploymentController {

  private final DeploymentService deploymentService;

  public DeploymentController(DeploymentService deploymentService) {
    this.deploymentService = deploymentService;
  }

  @PostMapping("/{modelId}")
  public DeploymentService.DeployResult deploy(@PathVariable String modelId) {
    return deploymentService.deployModel(modelId);
  }
}

