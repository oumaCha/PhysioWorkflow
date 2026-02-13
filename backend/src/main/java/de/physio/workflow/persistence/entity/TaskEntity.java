package de.physio.workflow.persistence.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "task")
public class TaskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="instance_id", nullable=false)
    private Long instanceId;

    @Column(name="node_id", nullable=false)
    private String nodeId;

    @Column(nullable=false)
    private String name;

    @Column(name="actor_role", nullable=false)
    private String actorRole;

    @Column(name="context_key")
    private String contextKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="form_schema", nullable=false, columnDefinition="jsonb")
    private JsonNode formSchema;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="form_data", columnDefinition="jsonb")
    private JsonNode formData;

    @Column(nullable=false)
    private String status = "OPEN";

    @Column(name="created_at", nullable=false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name="completed_at")
    private OffsetDateTime completedAt;

    // ----- getters -----
    public Long getId() { return id; }
    public Long getInstanceId() { return instanceId; }
    public String getNodeId() { return nodeId; }
    public String getName() { return name; }
    public String getActorRole() { return actorRole; }
    public String getContextKey() { return contextKey; }
    public JsonNode getFormSchema() { return formSchema; }
    public JsonNode getFormData() { return formData; }
    public String getStatus() { return status; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getCompletedAt() { return completedAt; }

    // ----- setters -----
    public void setId(Long id) { this.id = id; }
    public void setInstanceId(Long instanceId) { this.instanceId = instanceId; }
    public void setNodeId(String nodeId) { this.nodeId = nodeId; }
    public void setName(String name) { this.name = name; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public void setContextKey(String contextKey) { this.contextKey = contextKey; }
    public void setFormSchema(JsonNode formSchema) { this.formSchema = formSchema; }
    public void setFormData(JsonNode formData) { this.formData = formData; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }
}
