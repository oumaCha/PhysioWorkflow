package de.physio.workflow.api;

import de.physio.workflow.api.dto.PhysioPatientListItemDTO;
import de.physio.workflow.domain.WorkflowDeploymentService;
import de.physio.workflow.domain.WorkflowInstanceService;
import de.physio.workflow.persistence.entity.PatientEntity;
import de.physio.workflow.persistence.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/physio/patients")
public class PhysioPatientController {

    private final PatientRepository patientRepository;
    private final WorkflowInstanceService workflowInstanceService;
    private final WorkflowDeploymentService workflowDeploymentService;   // ✅ NEW

    public PhysioPatientController(
            PatientRepository patientRepository,
            WorkflowInstanceService workflowInstanceService,
            WorkflowDeploymentService workflowDeploymentService   // ✅ NEW
    ) {
        this.patientRepository = patientRepository;
        this.workflowInstanceService = workflowInstanceService;
        this.workflowDeploymentService = workflowDeploymentService; // ✅ NEW
    }

    @GetMapping
    public List<PhysioPatientListItemDTO> list() {
        return patientRepository.findAll().stream()
                .map(p -> new PhysioPatientListItemDTO(
                        p.getId(),
                        p.getFirstName() + " " + p.getLastName(),
                        p.getReferralText(),
                        p.getStatus(),
                        p.getWorkflowInstanceId()
                ))
                .toList();
    }

    @PostMapping("/{patientId}/open-workflow")
    @ResponseStatus(HttpStatus.OK)
    public Long openWorkflow(@PathVariable Long patientId) {

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Patient not found: " + patientId));

        //  CASE B: already in treatment → reopen same workflow
        if (patient.getWorkflowInstanceId() != null) {
            return patient.getWorkflowInstanceId();
        }

        //  FIRST CLICK EVER → auto-deploy workflow if missing
        workflowDeploymentService.ensureAtLeastOneDeploymentExists();

        // Create workflow instance for this patient
        Long instanceId =
                workflowInstanceService.startLatestId("patient:" + patient.getId());

        patient.setWorkflowInstanceId(instanceId);
        patientRepository.save(patient);

        return instanceId;
    }
}

