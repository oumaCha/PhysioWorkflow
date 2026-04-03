package de.physio.workflow.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import de.physio.workflow.api.dto.CreateWorkflowDefinitionRequest;
import de.physio.workflow.domain.WorkflowDefinitionService;
import de.physio.workflow.persistence.entity.WorkflowDefinitionEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;


import java.util.List;

@RestController
@RequestMapping("/api/workflow-definitions")
public class WorkflowDefinitionController {

    private final WorkflowDefinitionService service;
    private final ObjectMapper objectMapper;

    public WorkflowDefinitionController(WorkflowDefinitionService service, ObjectMapper objectMapper) {
        this.service = service;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public WorkflowDefinitionEntity create(@RequestBody CreateWorkflowDefinitionRequest req) {
        JsonNode json = objectMapper.valueToTree(req.getDefinitionJson());
        return service.create(req.getName(), json);
    }

    @GetMapping
    public List<WorkflowDefinitionEntity> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public WorkflowDefinitionEntity get(@PathVariable Long id) {
        return service.get(id);
    }



    @PutMapping("/{id}")
    public WorkflowDefinitionEntity update(@PathVariable Long id, @RequestBody CreateWorkflowDefinitionRequest req) {
        if (req == null || req.getDefinitionJson() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "definitionJson required");
        }
        JsonNode json = objectMapper.valueToTree(req.getDefinitionJson());
        return service.update(id, req.getName(), json);
    }
}

