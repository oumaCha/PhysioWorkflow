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

            var latestDefOpt = definitionRepo.findTopByOrderByIdDesc();
            if (latestDefOpt.isEmpty()) {
                System.out.println("[deploy-seed] no workflow definitions found -> skip");
                return;
            }

            var latestDef = latestDefOpt.get();
            int defVersion = latestDef.getDefinitionJson().path("meta").path("version").asInt(0);

            var latestDepOpt = deploymentRepo.findTopByOrderByIdDesc();

            if (latestDepOpt.isPresent()) {
                var latestDep = latestDepOpt.get();
                int depVersion = latestDep.getDefinitionJson().path("meta").path("version").asInt(0);

                // ✅ if deployment version is up-to-date, skip
                if (depVersion >= defVersion) {
                    System.out.println("[deploy-seed] latest already deployed (version ok) -> skip");
                    return;
                }

                // ✅ otherwise redeploy
                System.out.println("[deploy-seed] template version increased -> redeploying: "
                        + depVersion + " -> " + defVersion);
            } else {
                System.out.println("[deploy-seed] no deployments found -> deploying v" + defVersion);
            }

            deploymentService.deploy(latestDef.getId());
            System.out.println("[deploy-seed] deployed definitionId=" + latestDef.getId() + " v" + defVersion);
        };
    }
}