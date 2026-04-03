package de.physio.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.physio.workflow.persistence.entity.WorkflowDefinitionEntity;
import de.physio.workflow.persistence.repository.WorkflowDefinitionRepository;
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
                    int fileVersion = definitionJson.path("meta").path("version").asInt(0);

                    if (metaKey == null || metaKey.isBlank()) {
                        System.out.println("[seed] Skip " + r.getFilename() + " meta.key missing");
                        continue;
                    }

                    var existingOpt = repo.findByMetaKey(metaKey);

                    if (existingOpt.isEmpty()) {

                        WorkflowDefinitionEntity e = new WorkflowDefinitionEntity();
                        e.setName(metaName);
                        e.setMetaKey(metaKey);
                        e.setDefinitionJson(definitionJson);

                        repo.save(e);

                        System.out.println("[seed] Inserted new template: " + metaKey + " v" + fileVersion);
                        continue;
                    }

                    WorkflowDefinitionEntity existing = existingOpt.get();

                    int dbVersion = existing.getDefinitionJson()
                            .path("meta")
                            .path("version")
                            .asInt(0);

                    if (fileVersion > dbVersion) {

                        existing.setName(metaName);
                        existing.setDefinitionJson(definitionJson);
                        repo.save(existing);

                        System.out.println("[seed] Created new version: "
                                + metaKey + " v" + dbVersion + " -> v" + fileVersion);

                    } else {

                        System.out.println("[seed] Exists (no new version): "
                                + metaKey + " dbVersion=" + dbVersion
                                + " fileVersion=" + fileVersion);
                    }

                } catch (Exception e) {
                    System.out.println("[seed] FAILED for file: " + r.getFilename());
                    e.printStackTrace();
                }
            }
        };
    }
}
