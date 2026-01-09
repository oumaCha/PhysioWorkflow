package de.workflow.physio.backend.api;

import de.workflow.physio.backend.domain.WorkflowModel;
import de.workflow.physio.backend.repo.WorkflowModelRepository;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/models")
@CrossOrigin(origins = "http://localhost:5173")
public class WorkflowModelController {

  private final WorkflowModelRepository repo;

  public WorkflowModelController(WorkflowModelRepository repo) {
    this.repo = repo;
  }

  @PutMapping(value = "/{id}", consumes = { MediaType.APPLICATION_XML_VALUE, MediaType.TEXT_PLAIN_VALUE })
  public WorkflowModel save(
          @PathVariable String id,
          @RequestParam(defaultValue = "Physio Workflow") String name,
          @RequestBody String bpmnXml
  ) {
    if (bpmnXml == null || !looksLikeBpmn(bpmnXml)) {
      throw new IllegalArgumentException("Body does not look like BPMN XML.");
    }

    return repo.findById(id)
            .map(existing -> {
              existing.setName(name);
              existing.setBpmnXml(bpmnXml);
              return repo.save(existing);
            })
            .orElseGet(() -> repo.save(new WorkflowModel(id, name, bpmnXml)));
  }

  @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_XML_VALUE)
  public String load(@PathVariable String id) {
    return repo.findById(id)
            .map(WorkflowModel::getBpmnXml)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Model not found: " + id));
  }

  private static boolean looksLikeBpmn(String xml) {
    String s = xml.trim();
    return s.contains("<definitions") && (s.contains("<process") || s.contains(":process"));
  }
}
