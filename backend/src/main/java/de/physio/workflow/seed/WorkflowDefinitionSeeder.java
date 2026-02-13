package de.physio.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.physio.workflow.persistence.repository.WorkflowDefinitionRepository;
import de.physio.workflow.domain.WorkflowDefinitionService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

@Configuration
public class WorkflowDefinitionSeeder {

    @Bean
    ApplicationRunner seedWorkflowDefinitions(
            WorkflowDefinitionRepository repo,
            WorkflowDefinitionService service,
            ObjectMapper objectMapper
    ) {
        return args -> {
            var resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath:/workflows/*.json");

            System.out.println(">>> Seeder started. workflow files found: " + resources.length);

            for (Resource r : resources) {
                try {
                    JsonNode definitionJson = objectMapper.readTree(r.getInputStream());

                    String metaKey = definitionJson.path("meta").path("key").asText(null);
                    String metaName = definitionJson.path("meta").path("name").asText(r.getFilename());

                    System.out.println(">>> Seeder file: " + r.getFilename() + " metaKey=" + metaKey);

                    if (metaKey == null || metaKey.isBlank()) {
                        System.out.println("[seed] Skip " + r.getFilename() + " (meta.key missing)");
                        continue;
                    }

                    // If your entity does NOT have metaKey column yet, comment this check out and seed once.
                    // Otherwise, keep it.
                    if (repo.existsByMetaKey(metaKey)) {
                        System.out.println("[seed] Exists (skip): " + metaKey);
                        continue;
                    }


                    // IMPORTANT: your current service expects (name, definitionJson) OR (request)
                    // Adjust to your service signature:
                    service.create(metaName, definitionJson);

                    System.out.println("[seed] Inserted: " + metaKey + " (" + metaName + ")");
                } catch (Exception e) {
                    System.out.println("[seed] FAILED for file: " + r.getFilename());
                    e.printStackTrace();
                }
            }
        };
    }
}
