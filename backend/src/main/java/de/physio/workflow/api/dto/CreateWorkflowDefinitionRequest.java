package de.physio.workflow.api.dto;

public class CreateWorkflowDefinitionRequest {
    private String name;
    private Object definitionJson; // <-- changed from JsonNode

    public String getName() { return name; }
    public Object getDefinitionJson() { return definitionJson; }

    public void setName(String name) { this.name = name; }
    public void setDefinitionJson(Object definitionJson) { this.definitionJson = definitionJson; }
}
