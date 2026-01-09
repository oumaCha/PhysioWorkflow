package de.workflow.physio.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import de.workflow.physio.backend.domain.WorkflowModel;

public interface WorkflowModelRepository extends JpaRepository<WorkflowModel, String> {}
