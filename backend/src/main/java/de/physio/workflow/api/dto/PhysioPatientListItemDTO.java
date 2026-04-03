package de.physio.workflow.api.dto;

public class PhysioPatientListItemDTO {

    private Long id;
    private String fullName;
    private String referralText;
    private String status;
    private Long workflowInstanceId;
    private String treatmentType;
    private Integer sessionsDone;
    private Integer sessionsPlanned;

    public PhysioPatientListItemDTO(
            Long id,
            String fullName,
            String referralText,
            String status,
            Long workflowInstanceId,
            String treatmentType,
            Integer sessionsDone,
            Integer sessionsPlanned
    ) {
        this.id = id;
        this.fullName = fullName;
        this.referralText = referralText;
        this.status = status;
        this.workflowInstanceId = workflowInstanceId;
        this.treatmentType = treatmentType;
        this.sessionsDone = sessionsDone;
        this.sessionsPlanned = sessionsPlanned;
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getReferralText() { return referralText; }
    public String getStatus() { return status; }
    public Long getWorkflowInstanceId() { return workflowInstanceId; }
    public String getTreatmentType() { return treatmentType; }
    public Integer getSessionsDone() { return sessionsDone; }
    public Integer getSessionsPlanned() { return sessionsPlanned; }
}
