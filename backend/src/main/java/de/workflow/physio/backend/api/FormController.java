package de.workflow.physio.backend.api;

import de.workflow.physio.backend.service.FormService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/forms")
public class FormController {

  private final FormService formService;

  public FormController(FormService formService) {
    this.formService = formService;
  }

  // PWA calls: GET /api/forms/{formKey}
  // Returns raw JSON stored in DB
  @GetMapping(value = "/{formKey}", produces = MediaType.APPLICATION_JSON_VALUE)
  public String getForm(@PathVariable String formKey) {
    return formService.getSchemaJson(formKey);
  }

  // Admin/dev endpoint to upload/replace schema
  // POST /api/forms/{formKey} with JSON body = schema
  @PostMapping(value = "/{formKey}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public Map<String, Object> upsert(
      @PathVariable String formKey,
      @RequestBody String schemaJson,
      @RequestParam(defaultValue = "admin") String userId
  ) {
    formService.upsert(formKey, schemaJson);
    return Map.of("status", "ok", "formKey", formKey, "updatedBy", userId);
  }
}
