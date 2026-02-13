package de.physio.workflow.persistence.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "workflow_layout")
public class WorkflowLayoutEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long instanceId;

    @Column(columnDefinition = "jsonb")
    private String layoutJson;

    public Long getId() {
        return id;
    }

    public Long getInstanceId() {
        return instanceId;
    }

    public void setInstanceId(Long instanceId) {
        this.instanceId = instanceId;
    }

    public String getLayoutJson() {
        return layoutJson;
    }

    public void setLayoutJson(String layoutJson) {
        this.layoutJson = layoutJson;
    }
}

