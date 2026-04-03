package de.physio.workflow.api;

import de.physio.workflow.api.dto.PhysioPatientListItemDTO;
import de.physio.workflow.domain.WorkflowDeploymentService;
import de.physio.workflow.domain.WorkflowInstanceService;
import de.physio.workflow.persistence.entity.PatientEntity;
import de.physio.workflow.persistence.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import de.physio.workflow.persistence.entity.WorkflowInstanceEntity;
import de.physio.workflow.persistence.repository.WorkflowInstanceRepository;
import de.physio.workflow.workflowengine.model.WorkflowPhaseMapper;

import java.util.List;

@RestController
@RequestMapping("/api/physio/patients")
public class PhysioPatientController {

    private final PatientRepository patientRepository;
    private final WorkflowInstanceService workflowInstanceService;
    private final WorkflowDeploymentService workflowDeploymentService;
    private final WorkflowInstanceRepository instanceRepo;

    private boolean isReceptionPhase(String node) {
        return "t_prescription_check".equals(node)
                || "t_deadline_check".equals(node)
                || "t_copay_check".equals(node);
    }

    public PhysioPatientController(
            PatientRepository patientRepository,
            WorkflowInstanceService workflowInstanceService,
            WorkflowDeploymentService workflowDeploymentService,
            WorkflowInstanceRepository instanceRepo
    ) {
        this.patientRepository = patientRepository;
        this.workflowInstanceService = workflowInstanceService;
        this.workflowDeploymentService = workflowDeploymentService;
        this.instanceRepo = instanceRepo;
    }

    @GetMapping
        public List<PhysioPatientListItemDTO> list() {

            return patientRepository.findAll().stream()

                    // must have workflow started
                    .filter(p -> p.getWorkflowInstanceId() != null)

                    // must be in physio phase
                    .filter(p -> {
                        WorkflowInstanceEntity inst =
                                instanceRepo.findById(p.getWorkflowInstanceId()).orElse(null);

                        if (inst == null) return false;

                        String node = inst.getCurrentNodeId();
                        String status = inst.getStatus();

                        // hide completed workflows
                        if ("COMPLETED".equalsIgnoreCase(status)) return false;

                        // physio starts at intake
                        return "t_intake".equals(node)
                                || "t_consent".equals(node)
                                || "t_assessment".equals(node)
                                || "t_pain_first_consult".equals(node)
                                || "x_pain_first_consult".equals(node)
                                || "t_refer_doctor_early".equals(node)
                                || "t_plan".equals(node)
                                || "t_schedule".equals(node)
                                || "t_session".equals(node)
                                || "t_reschedule".equals(node)
                                || "t_home_program".equals(node)
                                || "t_outcome".equals(node)
                                || "t_pain_outcome".equals(node)
                                || "x_pain_outcome".equals(node)
                                || "t_refer_doctor_outcome".equals(node)
                                || "t_report".equals(node);
                    })

                    .map(p -> {

                        WorkflowInstanceEntity inst =
                                instanceRepo.findById(p.getWorkflowInstanceId()).orElse(null);



                        String treatmentType = p.getTreatmentArea(); // receptionist text

                        if (inst != null && inst.getContextJson() != null) {
                            var ctx = inst.getContextJson();

                            String fromWorkflow = null;

                            if (ctx.has("plan") && ctx.get("plan").has("therapyType")) {
                                fromWorkflow = ctx.get("plan").get("therapyType").asText(null);
                            } else if (ctx.has("prescription") && ctx.get("prescription").has("prescriptionType")) {
                                fromWorkflow = ctx.get("prescription").get("prescriptionType").asText(null);
                            }

                            //  Only override if workflow value is meaningful
                            if (fromWorkflow != null) {
                                String s = fromWorkflow.trim();
                                if (!s.isEmpty() && !"OTHER".equalsIgnoreCase(s)) {
                                    treatmentType = s;
                                }
                            }
                        }

                        return new PhysioPatientListItemDTO(
                                p.getId(),
                                p.getFirstName() + " " + p.getLastName(),
                                p.getReferralText(),
                                p.getStatus(),
                                p.getWorkflowInstanceId(),
                                treatmentType,
                                p.getSessionsDone(),
                                p.getSessionsPlanned()
                        );
                    })
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
            WorkflowInstanceEntity inst = instanceRepo.findById(patient.getWorkflowInstanceId())
                    .orElseThrow(() -> new IllegalArgumentException("Instance not found: " + patient.getWorkflowInstanceId()));

            patient.setStatus(WorkflowPhaseMapper.toPhase(inst.getCurrentNodeId()));
            patientRepository.save(patient);

            return patient.getWorkflowInstanceId();
        }

        //  FIRST CLICK EVER → auto-deploy workflow if missing
        workflowDeploymentService.ensureAtLeastOneDeploymentExists();

        // Create workflow instance for this patient
        Long instanceId =
                workflowInstanceService.startLatestId("patient:" + patient.getId());

        WorkflowInstanceEntity inst = instanceRepo.findById(instanceId)
                .orElseThrow(() -> new IllegalArgumentException("Instance not found: " + instanceId));

        patient.setWorkflowInstanceId(instanceId);

        //  set initial dashboard status from first active node
        patient.setStatus(WorkflowPhaseMapper.toPhase(inst.getCurrentNodeId()));

        patientRepository.save(patient);

        return instanceId;
    }
}

