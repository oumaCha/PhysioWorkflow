package de.physio.workflow.api.dto;

public class StartInstanceRequest {
    private Long deploymentId;
    private String businessKey; // patient/case id

    public Long getDeploymentId() { return deploymentId; }
    public String getBusinessKey() { return businessKey; }

    public void setDeploymentId(Long deploymentId) { this.deploymentId = deploymentId; }
    public void setBusinessKey(String businessKey) { this.businessKey = businessKey; }
}
