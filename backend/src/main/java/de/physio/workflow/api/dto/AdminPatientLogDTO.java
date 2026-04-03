package de.physio.workflow.api.dto;

import de.physio.workflow.persistence.entity.TaskEntity;
import java.util.List;

public class AdminPatientLogDTO {
    private Long patientId;
    private String fullName;
    private String currentNode;
    private List<TaskEntity> taskHistory;

    public AdminPatientLogDTO(Long patientId, String fullName, String currentNode, List<TaskEntity> taskHistory) {
        this.patientId = patientId;
        this.fullName = fullName;
        this.currentNode = currentNode;
        this.taskHistory = taskHistory;
    }

    public Long getPatientId() { return patientId; }
    public String getFullName() { return fullName; }
    public String getCurrentNode() { return currentNode; }
    public List<TaskEntity> getTaskHistory() { return taskHistory; }
}