package de.physio.workflow.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.physio.workflow.api.dto.StartInstanceRequest;
import de.physio.workflow.domain.WorkflowInstanceService;
import de.physio.workflow.persistence.entity.WorkflowInstanceEntity;
import de.physio.workflow.persistence.repository.WorkflowInstanceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class WorkflowInstanceController {

    private final WorkflowInstanceService instanceService;
    private final WorkflowInstanceRepository instanceRepository;
    private final ObjectMapper objectMapper;

    public WorkflowInstanceController(
            WorkflowInstanceService instanceService,
            WorkflowInstanceRepository instanceRepository,
            ObjectMapper objectMapper
    ) {
        this.instanceService = instanceService;
        this.instanceRepository = instanceRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/workflow-instances")
    public WorkflowInstanceEntity start(@RequestBody StartInstanceRequest req) {
        return instanceService.start(req.getDeploymentId(), req.getBusinessKey());
    }

    @GetMapping("/workflow-instances/{id}")
    public WorkflowInstanceEntity get(@PathVariable Long id) {
        return instanceService.get(id);
    }

    // -----------------------------
    // ✅ Overlay persistence
    // -----------------------------

    @GetMapping("/workflow-instances/{id}/overlay")
    public JsonNode getOverlay(@PathVariable Long id) {
        WorkflowInstanceEntity inst = instanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Instance not found: " + id));

        JsonNode ov = inst.getOverlayJson();
        return ov != null ? ov : objectMapper.createObjectNode();
    }

    @PutMapping("/workflow-instances/{id}/overlay")
    public JsonNode saveOverlay(@PathVariable Long id, @RequestBody JsonNode overlay) {
        if (overlay == null || !overlay.isObject()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Overlay must be a JSON object");
        }

        // optional validation: must contain nodes/edges arrays if present
        if (overlay.has("nodes") && !overlay.get("nodes").isArray()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "overlay.nodes must be an array");
        }
        if (overlay.has("edges") && !overlay.get("edges").isArray()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "overlay.edges must be an array");
        }

        WorkflowInstanceEntity inst = instanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Instance not found: " + id));

        inst.setOverlayJson(overlay);
        instanceRepository.save(inst);

        return inst.getOverlayJson();
    }
}

