package de.physio.workflow.persistence.repository;

import de.physio.workflow.persistence.entity.PatientEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<PatientEntity, Long> {
    Optional<PatientEntity> findByWorkflowInstanceId(Long workflowInstanceId);

    List<PatientEntity> findAllByWorkflowInstanceIdIn(List<Long> workflowInstanceIds);
}