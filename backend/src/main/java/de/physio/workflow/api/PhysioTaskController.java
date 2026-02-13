package de.physio.workflow.api;

import de.physio.workflow.domain.TaskService;
import de.physio.workflow.persistence.entity.TaskEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/physio/tasks")
public class PhysioTaskController {

    private final TaskService taskService;

    public PhysioTaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * List only OPEN tasks for physiotherapist dashboard
     */
    @GetMapping
    public List<TaskEntity> listOpenTasks() {
        return taskService.findOpenTasks();
    }
}
