package de.physio.workflow.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.physio.workflow.persistence.entity.WorkflowLayoutEntity;
import de.physio.workflow.persistence.repository.WorkflowLayoutRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class WorkflowLayoutController {

    private final WorkflowLayoutRepository repo;
    private final ObjectMapper om;

    public WorkflowLayoutController(WorkflowLayoutRepository repo, ObjectMapper om) {
        this.repo = repo;
        this.om = om;
    }

    @GetMapping("/workflow-instances/{id}/layout")
    public JsonNode getLayout(@PathVariable Long id) throws Exception {
        return repo.findByInstanceId(id)
                .map(e -> {
                    try {
                        return om.readTree(e.getLayoutJson());
                    } catch (Exception ex) {
                        return om.createObjectNode();
                    }
                })
                .orElse(om.createObjectNode());
    }

    @PutMapping("/workflow-instances/{id}/layout")
    public void saveLayout(@PathVariable Long id, @RequestBody JsonNode layout) throws Exception {
        WorkflowLayoutEntity entity = repo.findByInstanceId(id)
                .orElseGet(WorkflowLayoutEntity::new);

        entity.setInstanceId(id);
        entity.setLayoutJson(om.writeValueAsString(layout));

        repo.save(entity);
    }
}
