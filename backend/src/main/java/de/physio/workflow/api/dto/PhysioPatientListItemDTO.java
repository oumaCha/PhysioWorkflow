package de.physio.workflow.api.dto;

public class PhysioPatientListItemDTO {

    private Long id;
    private String fullName;
    private String referralText;
    private String status;
    private Long workflowInstanceId;

    public PhysioPatientListItemDTO(Long id, String fullName, String referralText, String status, Long workflowInstanceId) {
        this.id = id;
        this.fullName = fullName;
        this.referralText = referralText;
        this.status = status;
        this.workflowInstanceId = workflowInstanceId;
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getReferralText() { return referralText; }
    public String getStatus() { return status; }
    public Long getWorkflowInstanceId() { return workflowInstanceId; }
}
