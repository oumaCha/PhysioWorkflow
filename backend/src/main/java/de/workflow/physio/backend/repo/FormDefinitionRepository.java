package de.workflow.physio.backend.repo;

import de.workflow.physio.backend.domain.FormDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FormDefinitionRepository extends JpaRepository<FormDefinition, String> {}
