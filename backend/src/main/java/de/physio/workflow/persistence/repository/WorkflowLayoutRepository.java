package de.physio.workflow.persistence.repository;

import de.physio.workflow.persistence.entity.WorkflowLayoutEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkflowLayoutRepository extends JpaRepository<WorkflowLayoutEntity, Long> {
    Optional<WorkflowLayoutEntity> findByInstanceId(Long instanceId);
}
