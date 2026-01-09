package de.workflow.physio.backend.service;

import org.flowable.engine.RuntimeService;
import org.flowable.engine.runtime.ProcessInstance;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CaseService {

  private final RuntimeService runtimeService;

  public CaseService(RuntimeService runtimeService) {
    this.runtimeService = runtimeService;
  }

  public StartCaseResult startCase(String processKey, String patientId, String prescriptionId) {
    String businessKey = patientId + ":" + prescriptionId;

    ProcessInstance pi = runtimeService.startProcessInstanceByKey(
        processKey,
        businessKey,
        Map.of(
            "patientId", patientId,
            "prescriptionId", prescriptionId
        )
    );

    return new StartCaseResult(pi.getProcessInstanceId(), businessKey);
  }

  public record StartCaseResult(String processInstanceId, String businessKey) {}
}
