package de.physio.workflow.api.dto;

public class AdminUserDTO {
    private Long id;
    private String username;
    private String role;
    private boolean enabled;

    public AdminUserDTO(Long id, String username, String role, boolean enabled) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.enabled = enabled;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getRole() { return role; }
    public boolean isEnabled() { return enabled; }
}