package de.physio.workflow.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;


public class ReceptionPatientCreateRequest {

    @NotBlank(message = "Please enter the patient's first name")
    private String firstName;

    @NotBlank(message = "Please enter the patient's last name")
    private String lastName;


    private Integer sessionsPlanned;
    /**
     * High-level intake field only (privacy-safe).
     * Examples: knee injury, shoulder pain, post-op rehab
     */
    @NotBlank(message = "Please enter the type of physiotherapy for the patient")
    @Size(max = 255, message = "Physiotherapy type must be at most 255 characters")
    private String treatmentArea;

    // Optional; stored but never returned to receptionist later
    private String referralText;

    // Optional free-text intake note
    private String intakeText;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getTreatmentArea() { return treatmentArea; }
    public void setTreatmentArea(String treatmentArea) { this.treatmentArea = treatmentArea; }

    public String getReferralText() { return referralText; }
    public void setReferralText(String referralText) { this.referralText = referralText; }

    public String getIntakeText() { return intakeText; }
    public void setIntakeText(String intakeText) { this.intakeText = intakeText; }

    public Integer getSessionsPlanned() {
        return sessionsPlanned;
    }

    public void setSessionsPlanned(Integer sessionsPlanned) {
        this.sessionsPlanned = sessionsPlanned;
    }

}
