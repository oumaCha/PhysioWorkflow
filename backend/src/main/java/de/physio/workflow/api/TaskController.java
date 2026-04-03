package de.physio.workflow.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.physio.workflow.api.dto.CompleteTaskRequest;
import de.physio.workflow.domain.TaskService;
import de.physio.workflow.persistence.entity.PatientEntity;
import de.physio.workflow.persistence.entity.TaskEntity;
import de.physio.workflow.persistence.repository.PatientRepository;
import de.physio.workflow.persistence.repository.TaskRepository;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final ObjectMapper om;
    private final PatientRepository patientRepository;

    public TaskController(
            TaskRepository taskRepository,
            TaskService taskService,
            ObjectMapper om,
            PatientRepository patientRepository
    ) {
        this.taskRepository = taskRepository;
        this.taskService = taskService;
        this.om = om;
        this.patientRepository = patientRepository;
    }

    @GetMapping("/tasks")
    public List<TaskEntity> list(@RequestParam(defaultValue = "OPEN") String status) {
        return taskRepository.findByStatusOrderByCreatedAtAsc(status);
    }

    // ✅ tasks + patientName (no DTO)
    @GetMapping("/tasks-with-patient")
    public List<Map<String, Object>> listWithPatient(@RequestParam(defaultValue = "OPEN") String status) {
        List<TaskEntity> tasks = taskRepository.findByStatusOrderByCreatedAtAsc(status);

        List<Long> instanceIds = tasks.stream()
                .map(TaskEntity::getInstanceId)
                .distinct()
                .toList();

        Map<Long, PatientEntity> patientByInstance = patientRepository
                .findAllByWorkflowInstanceIdIn(instanceIds)
                .stream()
                .filter(p -> p.getWorkflowInstanceId() != null)
                .collect(Collectors.toMap(PatientEntity::getWorkflowInstanceId, Function.identity()));

        return tasks.stream().map(t -> {
            PatientEntity p = patientByInstance.get(t.getInstanceId());

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("instanceId", t.getInstanceId());
            m.put("nodeId", t.getNodeId());
            m.put("name", t.getName());
            m.put("actorRole", t.getActorRole());
            m.put("status", t.getStatus());
            m.put("createdAt", t.getCreatedAt());
            m.put("patientId", p == null ? null : p.getId());
            m.put("patientName", p == null ? null : (p.getFirstName() + " " + p.getLastName()));
            return m;
        }).toList();
    }

    @GetMapping("/tasks/{id}")
    public TaskEntity get(@PathVariable Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + id));
    }

    @PostMapping("/tasks/{id}/complete")
    public TaskEntity complete(@PathVariable Long id, @RequestBody CompleteTaskRequest req) {
        JsonNode formData = (req.getData() == null) ? null : om.valueToTree(req.getData());
        return taskService.complete(id, formData);
    }

    @GetMapping("/workflow-instances/{id}/tasks")
    public List<TaskEntity> listForInstance(@PathVariable("id") Long instanceId) {
        return taskRepository.findByInstanceIdOrderByCreatedAtAsc(instanceId);
    }
}