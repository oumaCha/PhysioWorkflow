package de.physio.workflow.domain;

import com.fasterxml.jackson.databind.JsonNode;
import de.physio.workflow.persistence.entity.WorkflowDefinitionEntity;
import de.physio.workflow.persistence.repository.WorkflowDefinitionRepository;
import de.physio.workflow.validation.WorkflowJsonValidator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class WorkflowDefinitionService {

    private final WorkflowDefinitionRepository repo;
    private final WorkflowJsonValidator validator;

    public WorkflowDefinitionService(WorkflowDefinitionRepository repo, WorkflowJsonValidator validator) {
        this.repo = repo;
        this.validator = validator;
    }

    public WorkflowDefinitionEntity create(String name, JsonNode definitionJson) {
        // validate definitionJson structure
        validator.validateOrThrow(definitionJson);

        // extract meta.key as stable unique key
        String metaKey = definitionJson.path("meta").path("key").asText(null);
        if (metaKey == null || metaKey.isBlank()) {
            throw new IllegalArgumentException("Invalid workflow definition JSON: meta.key must not be empty");
        }

        // If name is missing, fallback to meta.name
        if (name == null || name.isBlank()) {
            String metaName = definitionJson.path("meta").path("name").asText(null);
            name = (metaName == null || metaName.isBlank()) ? metaKey : metaName;
        }

        // prevent duplicates (nice error for manual POST)
        if (repo.existsByMetaKey(metaKey)) {
            throw new IllegalArgumentException("Workflow definition already exists for meta.key: " + metaKey);
        }

        WorkflowDefinitionEntity e = new WorkflowDefinitionEntity();
        e.setName(name);
        e.setMetaKey(metaKey);
        e.setDefinitionJson(definitionJson);

        return repo.save(e);
    }

    public List<WorkflowDefinitionEntity> list() {
        return repo.findAll();
    }

    public WorkflowDefinitionEntity get(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Definition not found: " + id));
    }

    public WorkflowDefinitionEntity update(Long id, String name, JsonNode definitionJson) {
        WorkflowDefinitionEntity existing = get(id);

        // validate structure
        validator.validateOrThrow(definitionJson);

        // meta.key must exist
        String metaKey = definitionJson.path("meta").path("key").asText(null);
        if (metaKey == null || metaKey.isBlank()) {
            throw new IllegalArgumentException("Invalid workflow definition JSON: meta.key must not be empty");
        }

        // do not allow changing meta.key (keeps definition stable)
        if (!metaKey.equals(existing.getMetaKey())) {
            throw new IllegalArgumentException(
                    "meta.key cannot be changed (existing=" + existing.getMetaKey() + ", new=" + metaKey + ")"
            );
        }

        // If name missing, fallback to meta.name
        if (name == null || name.isBlank()) {
            String metaName = definitionJson.path("meta").path("name").asText(null);
            name = (metaName == null || metaName.isBlank()) ? metaKey : metaName;
        }

        existing.setName(name);
        existing.setDefinitionJson(definitionJson);
        return repo.save(existing);
    }
}
