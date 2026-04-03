package de.physio.workflow.api;

import de.physio.workflow.api.dto.AdminPatientLogDTO;
import de.physio.workflow.persistence.entity.TaskEntity;
import de.physio.workflow.persistence.entity.WorkflowInstanceEntity;
import de.physio.workflow.persistence.repository.PatientRepository;
import de.physio.workflow.persistence.repository.TaskRepository;
import de.physio.workflow.persistence.repository.WorkflowInstanceRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminDashboardController {

    private final PatientRepository patientRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final TaskRepository taskRepository;

    public AdminDashboardController(
            PatientRepository patientRepository,
            WorkflowInstanceRepository workflowInstanceRepository,
            TaskRepository taskRepository
    ) {
        this.patientRepository = patientRepository;
        this.workflowInstanceRepository = workflowInstanceRepository;
        this.taskRepository = taskRepository;
    }

    // Admin reads logs of all patients
    @GetMapping("/patients")
    public List<AdminPatientLogDTO> getAllPatientLogs() {
        return patientRepository.findAll().stream().map(p -> {

            WorkflowInstanceEntity inst = null;
            List<TaskEntity> tasks = List.of();

            if (p.getWorkflowInstanceId() != null) {
                inst = workflowInstanceRepository.findById(p.getWorkflowInstanceId()).orElse(null);
                tasks = taskRepository.findByInstanceIdOrderByCreatedAtAsc(p.getWorkflowInstanceId());
            }

            return new AdminPatientLogDTO(
                    p.getId(),
                    p.getFirstName() + " " + p.getLastName(),
                    inst != null ? inst.getCurrentNodeId() : null,
                    tasks
            );
        }).toList();
    }
}