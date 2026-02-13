package de.physio.workflow.api;

import de.physio.workflow.persistence.entity.WorkflowInstanceEntity;
import de.physio.workflow.persistence.repository.WorkflowInstanceRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/physio/instances")
public class PhysioCaseViewController {

    private final WorkflowInstanceRepository instanceRepository;

    public PhysioCaseViewController(WorkflowInstanceRepository instanceRepository) {
        this.instanceRepository = instanceRepository;
    }

    @GetMapping("/{instanceId}/case-view")
    public Map<String, Object> getCaseView(@PathVariable Long instanceId) {

        WorkflowInstanceEntity inst = instanceRepository.findById(instanceId)
                .orElseThrow(() -> new IllegalArgumentException("Instance not found"));

        String phase;
        String status = inst.getStatus();

        if ("COMPLETED".equalsIgnoreCase(status)) {
            phase = "End treatment";
        } else if (inst.getCurrentNodeId() == null) {
            phase = "Assigned to physiotherapist";
        } else {
            phase = "In treatment";
        }

        return Map.of(
                "instanceId", inst.getId(),
                "status", status,
                "currentPhase", phase
        );
    }
}
