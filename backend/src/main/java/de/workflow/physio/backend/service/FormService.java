package de.workflow.physio.backend.service;

import de.workflow.physio.backend.repo.FormDefinitionRepository;
import org.springframework.stereotype.Service;

@Service
public class FormService {

  private final FormDefinitionRepository repo;

  public FormService(FormDefinitionRepository repo) {
    this.repo = repo;
  }

  public String getSchemaJson(String formKey) {
    return repo.findById(formKey)
        .orElseThrow(() -> new IllegalArgumentException("Form not found: " + formKey))
        .getSchemaJson();
  }

  public void upsert(String formKey, String schemaJson) {
    var entity = repo.findById(formKey).orElseGet(() -> {
      var f = new de.workflow.physio.backend.domain.FormDefinition();
      f.setFormKey(formKey);
      f.setVersion(1);
      return f;
    });

    entity.setSchemaJson(schemaJson);
    // if updating, bump version (optional)
    entity.setVersion(entity.getVersion() + 1);

    repo.save(entity);
  }
}
