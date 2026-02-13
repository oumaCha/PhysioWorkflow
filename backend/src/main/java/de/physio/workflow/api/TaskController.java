package de.physio.workflow.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.physio.workflow.api.dto.CompleteTaskRequest;
import de.physio.workflow.domain.TaskService;
import de.physio.workflow.persistence.entity.TaskEntity;
import de.physio.workflow.persistence.repository.TaskRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final ObjectMapper om;

    public TaskController(TaskRepository taskRepository, TaskService taskService, ObjectMapper om) {
        this.taskRepository = taskRepository;
        this.taskService = taskService;
        this.om = om;
    }

    @GetMapping("/tasks")
    public List<TaskEntity> list(@RequestParam(defaultValue = "OPEN") String status) {
        return taskRepository.findByStatusOrderByCreatedAtAsc(status);
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
