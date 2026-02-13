package de.physio.workflow.api;

import de.physio.workflow.persistence.entity.PatientEntity;
import de.physio.workflow.persistence.repository.PatientRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientRepository patientRepository;

    public PatientController(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @PostMapping
    public PatientEntity create(@RequestBody PatientEntity patient) {
        return patientRepository.save(patient);
    }

    @GetMapping
    public List<PatientEntity> list() {
        return patientRepository.findAll();
    }
}

