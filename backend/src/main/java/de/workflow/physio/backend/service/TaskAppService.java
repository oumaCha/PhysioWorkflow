package de.workflow.physio.backend.service;

import de.workflow.physio.backend.workflow.FormKeyMapper;
import org.flowable.engine.TaskService;
import org.flowable.task.api.Task;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TaskAppService {

  private final TaskService taskService;
  private final FormKeyMapper formKeyMapper;

  public TaskAppService(TaskService taskService, FormKeyMapper formKeyMapper) {
    this.taskService = taskService;
    this.formKeyMapper = formKeyMapper;
  }

  /**
   * Task inbox for your PWA (tablet).
   * You can query by assignee OR by candidateGroup.
   *
   * Examples:
   *  - /api/tasks?candidateGroup=ADMIN
   *  - /api/tasks?candidateGroup=THERAPIST
   *  - /api/tasks?assignee=therapist1
   */
  public List<Map<String, Object>> inbox(String assignee, String candidateGroup) {
    var q = taskService.createTaskQuery()
            .active()
            .orderByTaskCreateTime()
            .desc();

    if (assignee != null && !assignee.isBlank()) {
      q = q.taskAssignee(assignee);
    }
    if (candidateGroup != null && !candidateGroup.isBlank()) {
      q = q.taskCandidateGroup(candidateGroup);
    }

    return q.list().stream().map(t -> {
      // IMPORTANT: do not use Map.of(...) here; it crashes if any value is null.
      Map<String, Object> m = new LinkedHashMap<>();
      m.put("id", t.getId());
      m.put("name", t.getName());
      m.put("assignee", t.getAssignee());                // may be null (unclaimed task)
      m.put("processInstanceId", t.getProcessInstanceId());
      m.put("taskDefinitionKey", t.getTaskDefinitionKey());
      m.put("created", t.getCreateTime());               // may be null in some setups
      return m;
    }).toList();
  }

  /**
   * Task detail endpoint: provides task metadata + a formKey so the PWA can load the right form schema.
   */
  public Map<String, Object> detail(String taskId) {
    Task t = taskService.createTaskQuery().taskId(taskId).singleResult();
    if (t == null) {
      throw new IllegalArgumentException("Task not found: " + taskId);
    }

    String formKey = formKeyMapper.formKeyForTaskDefinition(t.getTaskDefinitionKey());

    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", t.getId());
    m.put("name", t.getName());
    m.put("assignee", t.getAssignee());
    m.put("processInstanceId", t.getProcessInstanceId());
    m.put("taskDefinitionKey", t.getTaskDefinitionKey());
    m.put("created", t.getCreateTime());
    m.put("formKey", formKey);
    m.put("variables", taskService.getVariables(taskId));
    return m;
  }

  /**
   * Complete a task. If it is unassigned, we "claim" it by setting assignee to userId.
   */
  public void complete(String taskId, String userId, Map<String, Object> variables) {
    if (userId == null || userId.isBlank()) {
      throw new IllegalArgumentException("userId is required");
    }

    Task t = taskService.createTaskQuery().taskId(taskId).singleResult();
    if (t == null) {
      throw new IllegalArgumentException("Task not found: " + taskId);
    }

    // Claim if unassigned
    if (t.getAssignee() == null || t.getAssignee().isBlank()) {
      taskService.setAssignee(taskId, userId);
    }

    taskService.complete(taskId, variables == null ? Map.of() : variables);
  }
}
