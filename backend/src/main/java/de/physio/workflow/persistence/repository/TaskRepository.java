package de.physio.workflow.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import de.physio.workflow.persistence.entity.TaskEntity;
import java.util.List;

public interface TaskRepository extends JpaRepository<TaskEntity, Long> {
    List<TaskEntity> findByStatusOrderByCreatedAtAsc(String status);
    List<TaskEntity> findByInstanceIdOrderByCreatedAtAsc(Long instanceId);
    List<TaskEntity> findByStatus(String status);

}
