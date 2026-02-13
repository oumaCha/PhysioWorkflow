package de.physio.workflow.persistence.repository;

import de.physio.workflow.persistence.entity.WorkflowEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowEventRepository extends JpaRepository<WorkflowEventEntity, Long> {
    List<WorkflowEventEntity> findByInstanceIdOrderByCreatedAtAsc(Long instanceId);
}
