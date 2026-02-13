package de.physio.workflow.api.dto;

import java.time.Instant;

public class ReceptionPatientListItemDTO {

    private Long id;
    private String displayLabel;     // Full name for reception
    private String treatmentArea;    // Free text entered by reception
    private String statusLabel;      // Added / First consultation / Treatment / End
    private int sessionsDone;        // e.g. 2
    private int sessionsPlanned;     // e.g. 5
    private Instant createdAt;

    public ReceptionPatientListItemDTO(
            Long id,
            String displayLabel,
            String treatmentArea,
            String statusLabel,
            int sessionsDone,
            int sessionsPlanned,
            Instant createdAt
    ) {
        this.id = id;
        this.displayLabel = displayLabel;
        this.treatmentArea = treatmentArea;
        this.statusLabel = statusLabel;
        this.sessionsDone = sessionsDone;
        this.sessionsPlanned = sessionsPlanned;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getDisplayLabel() {
        return displayLabel;
    }

    public String getTreatmentArea() {
        return treatmentArea;
    }

    public String getStatusLabel() {
        return statusLabel;
    }

    public int getSessionsDone() {
        return sessionsDone;
    }

    public int getSessionsPlanned() {
        return sessionsPlanned;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
