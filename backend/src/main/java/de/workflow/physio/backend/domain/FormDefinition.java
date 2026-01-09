package de.workflow.physio.backend.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "form_definition")
public class FormDefinition {

  @Id
  private String formKey;          // e.g. "rx_check_v1", "assessment_v1"

  @Lob
  @Column(nullable = false)
  private String schemaJson;       // JSON schema stored as string

  private int version = 1;

  private Instant updatedAt;

  @PrePersist @PreUpdate
  public void touch() {
    updatedAt = Instant.now();
  }

  public String getFormKey() { return formKey; }
  public void setFormKey(String formKey) { this.formKey = formKey; }

  public String getSchemaJson() { return schemaJson; }
  public void setSchemaJson(String schemaJson) { this.schemaJson = schemaJson; }

  public int getVersion() { return version; }
  public void setVersion(int version) { this.version = version; }

  public Instant getUpdatedAt() { return updatedAt; }
}
