package de.workflow.physio.backend.api;

import de.workflow.physio.backend.service.CaseService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

  private final CaseService caseService;

  public CaseController(CaseService caseService) {
    this.caseService = caseService;
  }

  public record StartCaseRequest(
      @NotBlank String processKey,
      @NotBlank String patientId,
      @NotBlank String prescriptionId
  ) {}

  @PostMapping("/start")
  public CaseService.StartCaseResult start(@RequestBody StartCaseRequest req) {
    return caseService.startCase(req.processKey(), req.patientId(), req.prescriptionId());
  }
}
