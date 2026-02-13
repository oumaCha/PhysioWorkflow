package de.physio.workflow.persistence.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "workflow_deployment",
        uniqueConstraints = @UniqueConstraint(name="ux_workflow_deployment_def_version", columnNames = {"definition_id","version"}))
public class WorkflowDeploymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="definition_id", nullable=false)
    private Long definitionId;

    @Column(nullable=false)
    private int version;

    @Column(nullable=false)
    private boolean active = true;

    @Column(name="deployed_at", nullable=false)
    private OffsetDateTime deployedAt = OffsetDateTime.now();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="definition_json", nullable=false, columnDefinition="jsonb")
    private JsonNode definitionJson;

    public Long getId() { return id; }
    public Long getDefinitionId() { return definitionId; }
    public int getVersion() { return version; }
    public boolean isActive() { return active; }
    public OffsetDateTime getDeployedAt() { return deployedAt; }
    public JsonNode getDefinitionJson() { return definitionJson; }

    public void setId(Long id) { this.id = id; }
    public void setDefinitionId(Long definitionId) { this.definitionId = definitionId; }
    public void setVersion(int version) { this.version = version; }
    public void setActive(boolean active) { this.active = active; }
    public void setDeployedAt(OffsetDateTime deployedAt) { this.deployedAt = deployedAt; }
    public void setDefinitionJson(JsonNode definitionJson) { this.definitionJson = definitionJson; }
}

