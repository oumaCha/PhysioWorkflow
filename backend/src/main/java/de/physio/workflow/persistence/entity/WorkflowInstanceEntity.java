package de.physio.workflow.persistence.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.*;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;


import java.time.OffsetDateTime;

@Entity
@Table(name="workflow_instance")
public class WorkflowInstanceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // existing column in DB
    @Column(name="definition_id", nullable=false)
    private Long definitionId;

    // new column
    @Column(name="deployment_id")
    private Long deploymentId;

    @Column(nullable=false)
    private String status = "RUNNING"; // RUNNING, WAITING, COMPLETED, FAILED

    @Column(name="current_node_id")
    private String currentNodeId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="context_json", nullable=false, columnDefinition="jsonb")
    private JsonNode contextJson;

    @Column(name="created_at", nullable=false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name="updated_at", nullable=false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "overlay_json", columnDefinition = "jsonb", nullable = false)
    private JsonNode overlayJson;

    public Long getId() { return id; }
    public Long getDefinitionId() { return definitionId; }
    public Long getDeploymentId() { return deploymentId; }
    public String getStatus() { return status; }
    public String getCurrentNodeId() { return currentNodeId; }
    public JsonNode getContextJson() { return contextJson; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public void setId(Long id) { this.id = id; }
    public void setDefinitionId(Long definitionId) { this.definitionId = definitionId; }
    public void setDeploymentId(Long deploymentId) { this.deploymentId = deploymentId; }
    public void setStatus(String status) { this.status = status; }
    public void setCurrentNodeId(String currentNodeId) { this.currentNodeId = currentNodeId; }
    public void setContextJson(JsonNode contextJson) { this.contextJson = contextJson; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    public JsonNode getOverlayJson() {return overlayJson;}
    public void setOverlayJson(JsonNode overlayJson) {
        this.overlayJson = overlayJson;}


    @PrePersist
    public void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;

        if (status == null) status = "RUNNING";

        if (contextJson == null) {
            contextJson = JsonNodeFactory.instance.objectNode();
        }
        if (overlayJson == null) {
            overlayJson = JsonNodeFactory.instance.objectNode(); // ✅ prevents NULL insert
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = OffsetDateTime.now();
        if (contextJson == null) {
            contextJson = JsonNodeFactory.instance.objectNode();
        }
        if (overlayJson == null) {
            overlayJson = JsonNodeFactory.instance.objectNode();
        }
    }

}
