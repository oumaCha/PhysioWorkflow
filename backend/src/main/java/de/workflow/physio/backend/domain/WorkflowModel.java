package de.workflow.physio.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "workflow_models")
public class WorkflowModel {

  @Id
  @Column(length = 120)
  private String id;

  @Column(nullable = false)
  private String name;

  @Lob
  @Column(nullable = false, columnDefinition = "TEXT")
  private String bpmnXml;

  @Column(nullable = false)
  private Instant updatedAt;

  protected WorkflowModel() {}

  public WorkflowModel(String id, String name, String bpmnXml) {
    this.id = id;
    this.name = name;
    this.bpmnXml = bpmnXml;
    this.updatedAt = Instant.now();
  }

  @PrePersist
  @PreUpdate
  void touch() { this.updatedAt = Instant.now(); }

  public String getId() { return id; }
  public String getName() { return name; }
  public String getBpmnXml() { return bpmnXml; }
  public Instant getUpdatedAt() { return updatedAt; }

  public void setName(String name) { this.name = name; }
  public void setBpmnXml(String bpmnXml) { this.bpmnXml = bpmnXml; }
}
