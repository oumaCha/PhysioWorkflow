
package de.physio.workflow.api;
import de.physio.workflow.domain.WorkflowDeploymentService;
import de.physio.workflow.persistence.entity.WorkflowDeploymentEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class WorkflowDeploymentController {

    private final WorkflowDeploymentService deploymentService;

    public WorkflowDeploymentController(WorkflowDeploymentService deploymentService) {
        this.deploymentService = deploymentService;
    }

    @PostMapping("/workflow-definitions/{id}/deploy")
    public WorkflowDeploymentEntity deploy(@PathVariable("id") Long definitionId) {
        return deploymentService.deploy(definitionId);
    }
}
