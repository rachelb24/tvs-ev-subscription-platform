package com.tvs.filter;

import com.tvs.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    private final JwtUtil jwtUtil;

    private final Map<String, List<String>> roleMapping = new LinkedHashMap<>() {{
        // Public endpoints
        put("/api/users/login", List.of());
        put("/api/users/forgot-password/**", List.of());
        put("/api/orders/*/assign-free/*", List.of());
        put("/api/subscriptions/*/assign-free/*", List.of());

        put("/api/users/register", List.of());
        put("/api/v1/plans/active", List.of());
        put("/api/v1/plans/preview", List.of());
      
        // User and Admin access
        put("/api/plan-usage/**", List.of("USER", "ADMIN"));
        put("/api/subscriptions/**", List.of("USER", "ADMIN"));

        put("/api/users/profile", List.of("USER", "ADMIN")); // ✅ allow both roles
        put("/api/users/**", List.of("USER", "ADMIN"));
        put("/api/v1/plans/**", List.of("USER", "ADMIN"));
        put("/api/v1/features/**", List.of("USER", "ADMIN"));
        put("/api/orders/**", List.of("USER", "ADMIN"));
        put("/api/**", List.of("USER", "ADMIN"));

        // Admin-only endpoints
        put("/api/orders/all", List.of( "ADMIN"));
        put("/api/users/{userId}", List.of("ADMIN"));
        put("/api/users/all", List.of("ADMIN"));
        put("/api/v1/plans/*/activate", List.of("ADMIN"));
        put("/api/v1/plans/*/deactivate", List.of("ADMIN"));
        put("/api/notifications/**", List.of("ADMIN"));
        put("/internal/**", List.of("ADMIN"));
    }};


    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();

            // Skip authentication for public endpoints
            if (isPublicEndpoint(path)) {
                return chain.filter(exchange);
            }

            // Extract JWT token from Authorization header
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return unauthorized(exchange, "Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            String email;
            List<String> roles;

            try {
                if (!jwtUtil.validateToken(token)) {
                    return unauthorized(exchange, "Invalid or expired JWT token");
                }

                email = jwtUtil.extractUsername(token);
                roles = jwtUtil.extractRoles(token);

            } catch (Exception e) {
                return unauthorized(exchange, "Invalid or expired JWT token");
            }

            // Role-based access check
            if (!isRoleAllowed(path, roles)) {
                return forbidden(exchange, "Access denied: insufficient privileges");
            }

            // Forward Authorization header + user info to downstream services (only if present)
            ServerHttpRequest.Builder builder = request.mutate();

            // Ensure Authorization forwarded (it exists here)
            builder.header(HttpHeaders.AUTHORIZATION, authHeader);

            if (email != null && !email.isBlank()) {
                builder.header("X-User-Email", email);
            }
            if (roles != null && !roles.isEmpty()) {
                builder.header("X-User-Roles", String.join(",", roles));
            }

            ServerHttpRequest modifiedRequest = builder.build();
            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        };
    }

    private boolean isPublicEndpoint(String path) {
        return roleMapping.entrySet().stream()
                .filter(e -> e.getValue().isEmpty())
                .anyMatch(e -> pathMatches(e.getKey(), path));
    }

    private boolean isRoleAllowed(String path, List<String> userRoles) {
        for (Map.Entry<String, List<String>> entry : roleMapping.entrySet()) {
            if (pathMatches(entry.getKey(), path)) {
                List<String> allowedRoles = entry.getValue();
                if (allowedRoles.isEmpty()) return true; // public endpoint
                if (userRoles == null || userRoles.isEmpty()) return false;
                for (String role : userRoles) {
                    if (allowedRoles.contains(role)) return true;
                }
                return false;
            }
        }
        return true; // default: allow authenticated users
    }

    /**
     * Convert path patterns into regex-aware matching:
     * - {var} -> single path segment
     * - * -> single path segment
     * - ** -> zero or more segments
     *
     * Anchors the regex to the whole path.
     */
    private boolean pathMatches(String pattern, String path) {
        if (pattern == null || path == null) return false;

        // Escape regex meta-chars except the ones we will handle
        String escaped = pattern
                .replace(".", "\\.")
                .replace("?", "\\?")
                .replace("+", "\\+")
                .replace("^", "\\^")
                .replace("$", "\\$")
                .replace("(", "\\(")
                .replace(")", "\\)")
                .replace("|", "\\|");

        // Replace {variable} placeholders with a single segment matcher
        // pattern may contain literal braces; our usage uses {var} for placeholders
        escaped = escaped.replaceAll("\\{[^/]+\\}", "[^/]+");

        // Replace double-star (match zero or more segments)
        escaped = escaped.replace("**", ".*");

        // Replace single-star (match single path segment)
        escaped = escaped.replace("*", "[^/]+");

        // Anchor to full path
        String regex = "^" + escaped + "$";

        return path.matches(regex);
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        return sendError(exchange, HttpStatus.UNAUTHORIZED, message);
    }

    private Mono<Void> forbidden(ServerWebExchange exchange, String message) {
        return sendError(exchange, HttpStatus.FORBIDDEN, message);
    }

    private Mono<Void> sendError(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");
        String body = "{\"error\":\"" + message + "\", \"status\":" + status.value() + "}";
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes())));
    }

    public static class Config {
        // Can be extended if needed
    }
}
