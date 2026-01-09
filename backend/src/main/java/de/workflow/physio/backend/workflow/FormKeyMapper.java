package de.workflow.physio.backend.workflow;

import org.springframework.stereotype.Component;

@Component
public class FormKeyMapper {

  public String formKeyForTaskDefinition(String taskDefinitionKey) {
    if (taskDefinitionKey == null) return "default_v1";

    return switch (taskDefinitionKey) {
      case "rxCheck" -> "rx_check_v1";
      case "assessment" -> "assessment_v1"; // note: your BPMN task id is "assessment"
      default -> "default_v1";
    };
  }
}
