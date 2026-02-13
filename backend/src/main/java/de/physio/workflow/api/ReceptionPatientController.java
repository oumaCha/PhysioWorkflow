package de.physio.workflow.api;

import de.physio.workflow.api.dto.ReceptionPatientCreateRequest;
import de.physio.workflow.api.dto.ReceptionPatientListItemDTO;
import de.physio.workflow.persistence.entity.PatientEntity;
import de.physio.workflow.persistence.entity.WorkflowInstanceEntity;
import de.physio.workflow.persistence.repository.PatientRepository;
import de.physio.workflow.persistence.repository.WorkflowInstanceRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/reception/patients")
public class ReceptionPatientController {

    private final PatientRepository patientRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;

    public ReceptionPatientController(
            PatientRepository patientRepository,
            WorkflowInstanceRepository workflowInstanceRepository
    ) {
        this.patientRepository = patientRepository;
        this.workflowInstanceRepository = workflowInstanceRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReceptionPatientListItemDTO create(@Valid @RequestBody ReceptionPatientCreateRequest req) {
        PatientEntity p = new PatientEntity();
        p.setFirstName(req.getFirstName().trim());
        p.setLastName(req.getLastName().trim());

        // keep old field for now (so old frontend still works)
        if (req.getTreatmentArea() != null && !req.getTreatmentArea().isBlank()) {
            p.setTreatmentArea(req.getTreatmentArea().trim().toUpperCase());
        }

        // ✅ NEW: free text intake field (privacy-sensitive; keep short)
        p.setIntakeText(req.getIntakeText() == null ? "" : req.getIntakeText().trim());

        // stored, but not returned to receptionist
        p.setReferralText(req.getReferralText());

        PatientEntity saved = patientRepository.save(p);
        return toReceptionListItem(saved);
    }

    @GetMapping
    public List<ReceptionPatientListItemDTO> list() {
        return patientRepository.findAll().stream()
                .sorted(Comparator.comparing(PatientEntity::getCreatedAt).reversed())
                .map(this::toReceptionListItem)
                .toList();
    }

    private ReceptionPatientListItemDTO toReceptionListItem(PatientEntity p) {
        String statusLabel = computeReceptionStatusLabel(p);

        // add intakeText to ReceptionPatientListItemDTO (next step)
        return new ReceptionPatientListItemDTO(
                p.getId(),
                p.getFirstName() + " " + p.getLastName(),
                p.getTreatmentArea(),
                statusLabel,
                p.getSessionsDone(),
                p.getSessionsPlanned(),
                p.getCreatedAt()
        );
    }

    private String computeReceptionStatusLabel(PatientEntity p) {
        if (p.getWorkflowInstanceId() == null) return "Added";

        WorkflowInstanceEntity inst = workflowInstanceRepository.findById(p.getWorkflowInstanceId()).orElse(null);
        if (inst == null) return "Assigned to physiotherapist";

        String node = inst.getCurrentNodeId();
        String instStatus = inst.getStatus();

        if ("COMPLETED".equalsIgnoreCase(instStatus)) return "End treatment";
        if (node == null || node.isBlank() || "start".equalsIgnoreCase(node)) return "Assigned to physiotherapist";

        if (node.equals("t_prescription_check")
                || node.equals("t_deadline_check")
                || node.equals("t_copay_check")
                || node.equals("t_intake")
                || node.equals("t_consent")
                || node.equals("t_assessment")
                || node.equals("t_plan")
                || node.equals("t_schedule")) {
            return "First consultation";
        }

        if (node.equals("t_session")
                || node.equals("t_reschedule")
                || node.equals("t_home_program")
                || node.equals("t_outcome")
                || node.equals("t_followup_prescription")
                || node.equals("t_report")
                || node.equals("t_billing")) {
            return "Treatment";
        }

        if (node.equals("t_close_case")
                || node.equals("t_close_invalid")
                || node.equals("t_close_no_sessions")
                || node.equals("end")) {
            return "End treatment";
        }

        return "Treatment";
    }
}
