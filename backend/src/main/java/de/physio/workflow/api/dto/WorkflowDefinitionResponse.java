package de.physio.workflow.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import de.physio.workflow.persistence.entity.WorkflowDefinitionEntity;

import java.time.OffsetDateTime;

public class WorkflowDefinitionResponse {

    private Long id;
    private String name;
    private OffsetDateTime createdAt;
    private JsonNode definitionJson;

    public static WorkflowDefinitionResponse from(WorkflowDefinitionEntity e) {
        WorkflowDefinitionResponse r = new WorkflowDefinitionResponse();
        r.id = e.getId();
        r.name = e.getName();
        r.createdAt = e.getCreatedAt();
        r.definitionJson = e.getDefinitionJson();
        return r;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public JsonNode getDefinitionJson() { return definitionJson; }
}
