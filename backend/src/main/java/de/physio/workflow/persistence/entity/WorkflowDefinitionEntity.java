package de.physio.workflow.persistence.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "workflow_definition",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_workflow_definition_meta_key", columnNames = {"meta_key"})
        }
)
public class WorkflowDefinitionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Display name (human-friendly)
    @Column(nullable = false)
    private String name;

    // Stable unique key (from definitionJson.meta.key)
    @Column(name = "meta_key", nullable = false, unique = true, length = 200)
    private String metaKey;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "definition_json", nullable = false, columnDefinition = "jsonb")
    private JsonNode definitionJson;

    // getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getMetaKey() { return metaKey; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public JsonNode getDefinitionJson() { return definitionJson; }

    // setters
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setMetaKey(String metaKey) { this.metaKey = metaKey; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public void setDefinitionJson(JsonNode definitionJson) { this.definitionJson = definitionJson; }
}
