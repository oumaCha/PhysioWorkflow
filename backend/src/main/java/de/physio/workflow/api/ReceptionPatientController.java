package de.physio.workflow.api;

import de.physio.workflow.api.dto.ReceptionPatientCreateRequest;
import de.physio.workflow.api.dto.ReceptionPatientListItemDTO;
import de.physio.workflow.domain.WorkflowDeploymentService;
import de.physio.workflow.domain.WorkflowInstanceService;
import de.physio.workflow.persistence.entity.PatientEntity;
import de.physio.workflow.persistence.entity.WorkflowInstanceEntity;
import de.physio.workflow.persistence.repository.PatientRepository;
import de.physio.workflow.persistence.repository.WorkflowInstanceRepository;
import de.physio.workflow.workflowengine.model.WorkflowPhaseMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import de.physio.workflow.domain.TaskService;
import de.physio.workflow.persistence.entity.TaskEntity;
import de.physio.workflow.persistence.repository.TaskRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/reception/patients")
public class ReceptionPatientController {

    private final PatientRepository patientRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;

    //  add these:
    private final WorkflowDeploymentService workflowDeploymentService;
    private final WorkflowInstanceService workflowInstanceService;


    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final ObjectMapper objectMapper;


    public ReceptionPatientController(
            PatientRepository patientRepository,
            WorkflowInstanceRepository workflowInstanceRepository,
            WorkflowDeploymentService workflowDeploymentService,
            WorkflowInstanceService workflowInstanceService,
            TaskRepository taskRepository,
            TaskService taskService,
            ObjectMapper objectMapper
    ) {
        this.patientRepository = patientRepository;
        this.workflowInstanceRepository = workflowInstanceRepository;
        this.workflowDeploymentService = workflowDeploymentService;
        this.workflowInstanceService = workflowInstanceService;
        this.taskRepository = taskRepository;
        this.taskService = taskService;
        this.objectMapper = objectMapper;
    }


    private void autoCompleteOpenTaskIfPresent(PatientEntity patient, Long instanceId, String nodeId) {
        if (instanceId == null || nodeId == null) return;

        List<TaskEntity> openTasks =
                taskRepository.findByInstanceIdAndStatusOrderByCreatedAtAsc(instanceId, "OPEN");

        TaskEntity matching = openTasks.stream()
                .filter(t -> nodeId.equals(t.getNodeId()))
                .findFirst()
                .orElse(null);

        if (matching != null) {
            // defaults so the task isn't completed with empty data
            ObjectNode data = objectMapper.createObjectNode();
            data.put("prescriptionType", "Other");

            Integer planned = patient != null ? patient.getSessionsPlanned() : null;
            data.put("sessionsPrescribed", planned == null ? 0 : planned);

            data.put("valid", true);
            data.put("notes", "Auto-completed when receptionist opened workflow");

            taskService.complete(matching.getId(), data);
        }
    }


    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReceptionPatientListItemDTO create(@Valid @RequestBody ReceptionPatientCreateRequest req) {

        PatientEntity p = new PatientEntity();

        p.setFirstName(req.getFirstName().trim());
        p.setLastName(req.getLastName().trim());

        if (req.getTreatmentArea() != null && !req.getTreatmentArea().isBlank()) {
            p.setTreatmentArea(req.getTreatmentArea().trim().toUpperCase());
        }

        p.setIntakeText(req.getIntakeText() == null ? "" : req.getIntakeText().trim());
        p.setReferralText(req.getReferralText());

        //  HANDLE SESSIONS HERE (before saving)
        Integer planned = req.getSessionsPlanned();
        if (planned == null || planned < 0) {
            planned = 0;
        }

        p.setSessionsPlanned(planned);
        p.setSessionsDone(0);

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
        Long instanceId = p.getWorkflowInstanceId();
        String currentNodeId = null;
        if (instanceId != null) {
            WorkflowInstanceEntity inst = workflowInstanceRepository.findById(instanceId).orElse(null);
            if (inst != null) currentNodeId = inst.getCurrentNodeId();
        }

        return new ReceptionPatientListItemDTO(
                p.getId(),
                p.getFirstName() + " " + p.getLastName(),
                p.getTreatmentArea(),
                statusLabel,
                p.getSessionsDone(),
                p.getSessionsPlanned(),
                p.getCreatedAt(),
                instanceId,
                currentNodeId
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

    //  This is the endpoint Reception uses
    @PostMapping("/{patientId}/open-workflow")
    @ResponseStatus(HttpStatus.OK)
    public Long openWorkflow(@PathVariable Long patientId) {
        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found: " + patientId));

        // already started
        // already started
        if (patient.getWorkflowInstanceId() != null) {
            WorkflowInstanceEntity inst = workflowInstanceRepository.findById(patient.getWorkflowInstanceId())
                    .orElseThrow(() -> new IllegalArgumentException("Instance not found: " + patient.getWorkflowInstanceId()));

            String node = inst.getCurrentNodeId();

            //  allow receptionist to open ONLY while still in prescription/admin phase
            boolean stillReceptionPhase =
                    "t_prescription_check".equals(node) ||
                            "t_deadline_check".equals(node) ||
                            "t_copay_check".equals(node);


            if ("t_prescription_check".equals(node)) {
                autoCompleteOpenTaskIfPresent(patient, inst.getId(), "t_prescription_check");
                inst = workflowInstanceRepository.findById(patient.getWorkflowInstanceId())
                        .orElseThrow(() -> new IllegalArgumentException("Instance not found: " + patient.getWorkflowInstanceId()));
                node = inst.getCurrentNodeId();
            }

            if (!stillReceptionPhase) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Prescription already done.");
            }

            // sync status and return instance id
            patient.setStatus(WorkflowPhaseMapper.toPhase(node));
            patientRepository.save(patient);
            return patient.getWorkflowInstanceId();
        }

        // ensure workflow exists
        workflowDeploymentService.ensureAtLeastOneDeploymentExists();

        Long instanceId =
                workflowInstanceService.startLatestId("patient:" + patient.getId());
        //  skip prescription
       // workflowInstanceService.jumpToNode(instanceId, "t_intake");

        autoCompleteOpenTaskIfPresent(patient, instanceId, "t_prescription_check");


        WorkflowInstanceEntity inst = workflowInstanceRepository.findById(instanceId)
                .orElseThrow(() -> new IllegalArgumentException("Instance not found: " + instanceId));

        patient.setWorkflowInstanceId(instanceId);
        patient.setStatus(WorkflowPhaseMapper.toPhase(inst.getCurrentNodeId()));
        patientRepository.save(patient);

        return instanceId;
    }


    @PostMapping("/{patientId}/confirm-payment-and-close")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void confirmPaymentAndClose(@PathVariable Long patientId) {
        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found: " + patientId));

        Long instanceId = patient.getWorkflowInstanceId();
        if (instanceId == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Patient has no workflow instance.");
        }

        // complete billing if it is currently open
        List<TaskEntity> open = taskRepository.findByInstanceIdAndStatusOrderByCreatedAtAsc(instanceId, "OPEN");
        TaskEntity billing = open.stream().filter(t -> "t_billing".equals(t.getNodeId())).findFirst().orElse(null);
        if (billing != null) {
            ObjectNode billingData = objectMapper.createObjectNode();
            billingData.put("billed", true);
            billingData.put("notes", "Payment confirmed by reception");
            taskService.complete(billing.getId(), billingData);
        }

        // refresh open tasks (engine advances after completion)
        open = taskRepository.findByInstanceIdAndStatusOrderByCreatedAtAsc(instanceId, "OPEN");
        TaskEntity close = open.stream().filter(t -> "t_close_case".equals(t.getNodeId())).findFirst().orElse(null);
        if (close != null) {
            ObjectNode closeData = objectMapper.createObjectNode();
            closeData.put("closed", true);
            closeData.put("archiveNotes", "Closed after payment confirmation");
            taskService.complete(close.getId(), closeData);
        }

        // keep patient status synced
        WorkflowInstanceEntity inst = workflowInstanceRepository.findById(instanceId).orElse(null);
        if (inst != null) {
            patient.setStatus(WorkflowPhaseMapper.toPhase(inst.getCurrentNodeId()));
            patientRepository.save(patient);
        }
    }
}