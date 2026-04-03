package de.physio.workflow.api;

import de.physio.workflow.persistence.entity.UserEntity;
import de.physio.workflow.persistence.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import de.physio.workflow.api.dto.AdminUserDTO;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserRepository repo;
    private final PasswordEncoder encoder;

    public AdminUserController(UserRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public record CreateUserRequest(String username, String password, String role) {}
    public record CreateUserResponse(String message) {}

    @PostMapping
    public CreateUserResponse create(@RequestBody CreateUserRequest body) {

        String username = body.username() == null ? "" : body.username().trim();
        String password = body.password() == null ? "" : body.password();
        String role = body.role() == null ? "" : body.role().trim().toUpperCase();

        if (username.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required");
        if (password.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password is required");

        // allow only these two roles
        if (!(role.equals("RECEPTIONIST") || role.equals("PHYSIOTHERAPIST"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role must be RECEPTIONIST or PHYSIOTHERAPIST");
        }

        if (repo.findByUsername(username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "username already exists");
        }

        UserEntity u = new UserEntity();
        u.setUsername(username);
        u.setPasswordHash(encoder.encode(password));
        u.setRole(role); // stores plain strings, like your DB
        u.setEnabled(true);

        repo.save(u);
        return new CreateUserResponse("User created: " + username + " (" + role + ")");
    }


    @GetMapping
    public List<AdminUserDTO> listUsers() {
        var roles = List.of("RECEPTIONIST", "PHYSIOTHERAPIST");

        return repo.findAllByRoleIn(roles)
                .stream()
                .map(u -> new AdminUserDTO(u.getId(), u.getUsername(), u.getRole(), u.isEnabled()))
                .toList();
    }
}