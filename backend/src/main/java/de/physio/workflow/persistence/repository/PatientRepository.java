package de.physio.workflow.persistence.repository;

import de.physio.workflow.persistence.entity.PatientEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<PatientEntity, Long> {}
