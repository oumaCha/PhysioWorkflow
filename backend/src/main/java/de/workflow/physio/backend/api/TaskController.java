package de.workflow.physio.backend.api;

import de.workflow.physio.backend.service.TaskAppService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

  private final TaskAppService taskAppService;

  public TaskController(TaskAppService taskAppService) {
    this.taskAppService = taskAppService;
  }

  @GetMapping
  public List<Map<String, Object>> inbox(
      @RequestParam(required = false) String assignee,
      @RequestParam(required = false) String candidateGroup
  ) {
    return taskAppService.inbox(assignee, candidateGroup);
  }

  @GetMapping("/{taskId}")
  public Map<String, Object> detail(@PathVariable String taskId) {
    return taskAppService.detail(taskId);
  }

  public record CompleteTaskRequest(@NotBlank String userId, Map<String, Object> variables) {}

  @PostMapping("/{taskId}/complete")
  public Map<String, Object> complete(@PathVariable String taskId, @RequestBody CompleteTaskRequest req) {
    taskAppService.complete(taskId, req.userId(), req.variables());
    return Map.of("status", "ok");
  }
}
