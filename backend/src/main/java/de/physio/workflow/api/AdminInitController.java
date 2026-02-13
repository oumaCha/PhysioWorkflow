package de.physio.workflow.api;

import de.physio.workflow.persistence.entity.UserEntity;
import de.physio.workflow.persistence.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/init")
public class AdminInitController {

    private final UserRepository repo;
    private final PasswordEncoder encoder;

    public AdminInitController(UserRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    @PostMapping
    public String initUsers() {

        createIfNotExists("anna", "Physio123!", "PHYSIOTHERAPIST");
        createIfNotExists("max", "Recep123!", "RECEPTIONIST");
        createIfNotExists("becker", "Admin123!", "ADMIN");

        return "Users created!";
    }

    private void createIfNotExists(String username, String rawPassword, String role) {
        if (repo.findByUsername(username).isEmpty()) {
            UserEntity u = new UserEntity();
            u.setUsername(username);
            u.setPasswordHash(encoder.encode(rawPassword)); // <-- SYSTEM CREATES THE HASH
            u.setRole(role);
            u.setEnabled(true);
            repo.save(u);
        }
    }
}
