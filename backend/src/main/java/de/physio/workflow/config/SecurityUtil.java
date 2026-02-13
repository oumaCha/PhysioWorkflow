package de.physio.workflow.security;

import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtil {

    public static String currentRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;

        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority()) // e.g. ROLE_PHYSIO
                .findFirst()
                .orElse(null);
    }
}
