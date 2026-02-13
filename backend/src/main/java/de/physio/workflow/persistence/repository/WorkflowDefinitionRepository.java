package de.physio.workflow.persistence.repository;

import de.physio.workflow.persistence.entity.WorkflowDefinitionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WorkflowDefinitionRepository extends JpaRepository<WorkflowDefinitionEntity, Long> {

    boolean existsByMetaKey(String metaKey);

    Optional<WorkflowDefinitionEntity> findByMetaKey(String metaKey);
    Optional<WorkflowDefinitionEntity> findTopByOrderByIdDesc();

}
