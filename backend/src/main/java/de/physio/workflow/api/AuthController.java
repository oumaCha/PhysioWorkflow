package de.physio.workflow.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextHolderStrategy strategy =
            SecurityContextHolder.getContextHolderStrategy();

    public AuthController(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    public record LoginRequest(String username, String password) {}
    public record MeResponse(String username, List<String> roles) {}

    @PostMapping("/login")
    public MeResponse login(@RequestBody LoginRequest body, HttpServletRequest request) {

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(body.username(), body.password())
        );

        SecurityContext context = strategy.createEmptyContext();
        context.setAuthentication(auth);
        strategy.setContext(context);

        HttpSession session = request.getSession(true);
        session.setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                context
        );

        return toMe(auth);
    }

    @GetMapping("/me")
    public MeResponse me(Authentication authentication) {
        return toMe(authentication);
    }

    private MeResponse toMe(Authentication auth) {
        List<String> roles = auth.getAuthorities()
                .stream()
                .map(a -> a.getAuthority())
                .toList();

        return new MeResponse(auth.getName(), roles);
    }
}
