package de.physio.workflow.seed;

import de.physio.workflow.domain.WorkflowDeploymentService;
import de.physio.workflow.persistence.repository.WorkflowDefinitionRepository;
import de.physio.workflow.persistence.repository.WorkflowDeploymentRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WorkflowDeploymentSeeder {

    @Bean
    ApplicationRunner seedWorkflowDeploymentIfMissing(
            WorkflowDeploymentRepository deploymentRepo,
            WorkflowDefinitionRepository definitionRepo,
            WorkflowDeploymentService deploymentService
    ) {
        return args -> {
            // If at least one deployment exists, do nothing
            if (deploymentRepo.count() > 0) {
                System.out.println("[deploy-seed] deployment exists -> skip");
                return;
            }

            // Deploy the newest definition if available
            var latestDefOpt = definitionRepo.findTopByOrderByIdDesc();
            if (latestDefOpt.isEmpty()) {
                System.out.println("[deploy-seed] no workflow definitions found -> skip");
                return;
            }

            var def = latestDefOpt.get();
            deploymentService.deploy(def.getId());

            System.out.println("[deploy-seed] auto-deployed definitionId=" + def.getId() + " name=" + def.getName());
        };
    }
}
