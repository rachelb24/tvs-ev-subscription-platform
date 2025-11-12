package com.tvs.config;

import com.tvs.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class GatewayConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()

            // -------------------- User Service --------------------
        		.route("user_service_auth", r -> r
        			    .path(
        			        "/api/users/register",
        			        "/api/users/login",
        			        "/api/users/forgot-password/**" // ✅ added here so it bypasses auth
        			    )
        			    .uri("http://localhost:9003")
        			)
        			.route("user_service_all", r -> r
        			    .path("/api/users/**")
        			    .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
        			    .uri("http://localhost:9003")
        			)


            // -------------------- Plan Service --------------------
            .route("plan_service_all", r -> r
                .path("/api/v1/plans/**")
                .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("http://localhost:8081")
            )

            // -------------------- Feature Service --------------------
            .route("feature_service_all", r -> r
                .path("/api/v1/features/**", "/internal/features/**")
                .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("http://localhost:9001")
            )
            .route("order_service_assign_free", r -> r
            	    .path("/api/orders/*/assign-free/*")
            	    .uri("http://localhost:9004")
            	)

            // -------------------- Order Service --------------------
            .route("order_service_all", r -> r
                .path("/api/orders/**")
                .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("http://localhost:9004")
            )
            
            

            // -------------------- Payment Service --------------------
            .route("payment_service_all", r -> r
                .path("/api/payments/**")
                .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("http://localhost:9008")
            )
            .route("plan-usage_service_assign_free", r -> r
            	    .path("/api/subscriptions/*/assign-free/*")
            	    .uri("http://localhost:9007")
            	)
            // -------------------- Plan Usage & Subscription --------------------
            .route("plan_usage_service_all", r -> r
                .path("/api/plan-usage/**", "/api/subscriptions/**")
                .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("http://localhost:9007")
            )

            // -------------------- Notifications --------------------
            .route("email_service_all", r -> r
                .path("/api/notifications/**")
                .filters(f -> f.filter(jwtAuthenticationFilter.apply(new JwtAuthenticationFilter.Config())))
                .uri("http://localhost:9090")
            )

            .build();
    }
}

