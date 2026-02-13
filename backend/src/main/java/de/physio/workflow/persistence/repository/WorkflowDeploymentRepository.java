package de.physio.workflow.persistence.repository;

import de.physio.workflow.persistence.entity.WorkflowDeploymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import java.util.Optional;

public interface WorkflowDeploymentRepository extends JpaRepository<WorkflowDeploymentEntity, Long> {
    List<WorkflowDeploymentEntity> findByDefinitionIdOrderByVersionDesc(Long definitionId);
    Optional<WorkflowDeploymentEntity> findFirstByDefinitionIdAndActiveTrueOrderByVersionDesc(Long definitionId);
    Optional<WorkflowDeploymentEntity> findTopByOrderByIdDesc();
}
