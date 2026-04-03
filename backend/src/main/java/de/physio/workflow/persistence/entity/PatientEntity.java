package de.physio.workflow.persistence.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "patients")
public class PatientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private String firstName;

    @Column(nullable=false)
    private String lastName;

    @Column(name = "intake_text", length = 255)
    private String intakeText;



    /**
     * Reception is allowed to store ONLY a high-level area/type like:
     * KNEE, SHOULDER, BACK, HIP, ELBOW, OTHER
     * (no medical details)
     */


    /**
     * Potentially sensitive free text.
     * Keep it optional; Reception should not see it later.
     */
    @Column(length = 4000)
    private String referralText;

    @Column(nullable=false)
    private Instant createdAt;

    @Column
    private Long workflowInstanceId;

    @Column(name = "sessions_planned", nullable = false)
    private int sessionsPlanned = 0;

    @Column(name = "sessions_done", nullable = false)
    private int sessionsDone = 0;

    @Column(name = "treatment_area", nullable=false)
    private String treatmentArea;


    /**
     * Keep internal code, but Reception will see only a mapped label.
     */
    @Column(nullable=false)
    private String status; // e.g. "REFERRAL_RECEIVED"


    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = "REFERRAL_RECEIVED";
        if (treatmentArea == null) treatmentArea = "OTHER";
    }

    public Long getId() { return id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getTreatmentArea() { return treatmentArea; }
    public void setTreatmentArea(String treatmentArea) { this.treatmentArea = treatmentArea; }

    public String getReferralText() { return referralText; }
    public void setReferralText(String referralText) { this.referralText = referralText; }

    public Instant getCreatedAt() { return createdAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }



    public Long getWorkflowInstanceId() { return workflowInstanceId; }
    public void setWorkflowInstanceId(Long workflowInstanceId) { this.workflowInstanceId = workflowInstanceId; }


    public String getIntakeText() { return intakeText; }
    public void setIntakeText(String intakeText) { this.intakeText = intakeText; }

    public int getSessionsPlanned() { return sessionsPlanned; }
    public void setSessionsPlanned(int sessionsPlanned) { this.sessionsPlanned = sessionsPlanned; }

    public int getSessionsDone() { return sessionsDone; }
    public void setSessionsDone(int sessionsDone) { this.sessionsDone = sessionsDone; }
}

