package de.physio.workflow.persistence.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name="workflow_event")
public class WorkflowEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="instance_id", nullable=false)
    private Long instanceId;

    @Column(nullable=false)
    private String type;

    @Column(name="node_id")
    private String nodeId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable=false, columnDefinition="jsonb")
    private JsonNode data;

    @Column(name="created_at", nullable=false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    // getters
    public Long getId() { return id; }
    public Long getInstanceId() { return instanceId; }
    public String getType() { return type; }
    public String getNodeId() { return nodeId; }
    public JsonNode getData() { return data; }
    public OffsetDateTime getCreatedAt() { return createdAt; }

    // setters
    public void setId(Long id) { this.id = id; }
    public void setInstanceId(Long instanceId) { this.instanceId = instanceId; }
    public void setType(String type) { this.type = type; }
    public void setNodeId(String nodeId) { this.nodeId = nodeId; }
    public void setData(JsonNode data) { this.data = data; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
