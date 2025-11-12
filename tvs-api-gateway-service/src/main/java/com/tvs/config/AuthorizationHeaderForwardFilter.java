package com.tvs.config;

import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class AuthorizationHeaderForwardFilter implements GlobalFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Get the incoming Authorization header
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (authHeader != null) {
            // Forward Authorization header to downstream services
            exchange = exchange.mutate()
                    .request(exchange.getRequest().mutate()
                            .header("Authorization", authHeader)
                            .build())
                    .build();
        }

        return chain.filter(exchange);
    }
}
