package de.physio.workflow.api;

import com.fasterxml.jackson.databind.JsonNode;
import de.physio.workflow.api.dto.AllowedNextStepDto;
import de.physio.workflow.persistence.repository.WorkflowDeploymentRepository;
import de.physio.workflow.persistence.repository.WorkflowInstanceRepository;
import de.physio.workflow.workflowengine.model.GraphParser;                 // ✅ correct
import de.physio.workflow.workflowengine.model.WorkflowGraph;         // ✅ model
import de.physio.workflow.workflowengine.model.WfEdge;
import de.physio.workflow.workflowengine.model.WfNode;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workflow-instances")
public class WorkflowModelingController {

    private final WorkflowInstanceRepository instanceRepo;
    private final WorkflowDeploymentRepository deploymentRepo;
    private final GraphParser graphParser = new GraphParser();

    public WorkflowModelingController(WorkflowInstanceRepository instanceRepo,
                                      WorkflowDeploymentRepository deploymentRepo) {
        this.instanceRepo = instanceRepo;
        this.deploymentRepo = deploymentRepo;
    }

    @GetMapping("/{id}/allowed-next-steps")
    public List<AllowedNextStepDto> allowedNextSteps(@PathVariable("id") Long instanceId) {
        var inst = instanceRepo.findById(instanceId)
                .orElseThrow(() -> new IllegalArgumentException("WorkflowInstance not found: " + instanceId));

        var dep = deploymentRepo.findById(inst.getDeploymentId())
                .orElseThrow(() -> new IllegalArgumentException("WorkflowDeployment not found: " + inst.getDeploymentId()));

        JsonNode defJson = dep.getDefinitionJson();
        WorkflowGraph graph = graphParser.parse(defJson);

        String currentNodeId = inst.getCurrentNodeId();
        if (currentNodeId == null || currentNodeId.isBlank()) {
            currentNodeId = graph.findStartId();
        }

        List<WfEdge> outgoing = graph.outgoing(currentNodeId);
        if (outgoing == null || outgoing.isEmpty()) return List.of();

        List<WfNode> targets = outgoing.stream()
                .map(e -> graph.node(e.to()))
                .filter(Objects::nonNull)
                .toList();

        return targets.stream()
                .map(n -> new AllowedNextStepDto(
                        safeType(n),
                        safeLabel(n)
                ))
                .distinct()
                .collect(Collectors.toList());
    }

    private String safeType(WfNode n) {
        // Your WfNode has "type" as String in your GraphParser.
        if (n.type() != null) return n.type().toUpperCase(Locale.ROOT);
        if (n.name() != null) return n.name().toUpperCase(Locale.ROOT).replace(" ", "_");
        return n.id() != null ? n.id().toUpperCase(Locale.ROOT) : "UNKNOWN";
    }

    private String safeLabel(WfNode n) {
        if (n.name() != null && !n.name().isBlank()) return n.name();
        if (n.id() != null) return n.id();
        return "Step";
    }
}
