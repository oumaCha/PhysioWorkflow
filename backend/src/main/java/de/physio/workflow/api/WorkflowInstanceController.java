package de.physio.workflow.api;


import com.fasterxml.jackson.databind.ObjectMapper;
import de.physio.workflow.api.dto.StartInstanceRequest;
import de.physio.workflow.security.SecurityUtil;
import de.physio.workflow.domain.WorkflowInstanceService;
import de.physio.workflow.persistence.entity.WorkflowInstanceEntity;
import de.physio.workflow.persistence.repository.WorkflowInstanceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.List;


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
// ✅ Overlay persistence (no JsonNode in request/response)
// -----------------------------

    @GetMapping("/workflow-instances/{id}/overlay")
    public Object getOverlay(@PathVariable Long id) {
        WorkflowInstanceEntity inst = instanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Instance not found: " + id));

        // If your entity still stores JsonNode, return it as plain Object
        // This avoids binding JsonNode in the controller signature.
        Object overlay = objectMapper.convertValue(inst.getOverlayJson(), Object.class);
        return overlay != null ? overlay : Map.of();
    }

    @PutMapping("/workflow-instances/{id}/overlay")
    public Object saveOverlay(@PathVariable Long id, @RequestBody Object overlay) {
        if (!(overlay instanceof Map)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Overlay must be a JSON object");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> obj = (Map<String, Object>) overlay;

        // optional validation: nodes/edges must be arrays if present
        if (obj.containsKey("nodes") && !(obj.get("nodes") instanceof List)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "overlay.nodes must be an array");
        }
        if (obj.containsKey("edges") && !(obj.get("edges") instanceof List)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "overlay.edges must be an array");
        }

        WorkflowInstanceEntity inst = instanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Instance not found: " + id));

        // Store into entity: keep JsonNode internally, but don't accept JsonNode from HTTP
        // normalize to valid JSON (eliminates NaN/Infinity/unsupported types)
        Map<String, Object> normalized =
                objectMapper.convertValue(obj, Map.class);

        inst.setOverlayJson(objectMapper.valueToTree(normalized));

        instanceRepository.save(inst);

        // Return as plain JSON-able Object
        return objectMapper.convertValue(inst.getOverlayJson(), Object.class);
    }

    @PostMapping("/workflow-instances/{id}/jump/{nodeId}")
    public WorkflowInstanceEntity jumpToNode(@PathVariable Long id, @PathVariable String nodeId) {
        // ✅ Only physio can move progress from canvas
        String role = SecurityUtil.currentRole();
        if (role == null || !role.equals("ROLE_PHYSIOTHERAPIST")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only PHYSIO can jump workflow progress");
        }

        return instanceService.jumpToNode(id, nodeId);
    }

}

