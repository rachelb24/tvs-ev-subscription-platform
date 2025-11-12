package com.tvs.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient.Builder webClientBuilder() {

        ExchangeFilterFunction forwardHeadersFilter = (request, next) -> {
            RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes sra) {
                HttpServletRequest currentRequest = sra.getRequest();

                ClientRequest filtered = ClientRequest.from(request)
                        .headers(httpHeaders -> {
                            String authHeader = currentRequest.getHeader("Authorization");
                            String userId = currentRequest.getHeader("X-User-Id");
                            String roles = currentRequest.getHeader("X-User-Roles");

                            if (authHeader != null && !authHeader.isBlank())
                                httpHeaders.set("Authorization", authHeader);
                            if (userId != null && !userId.isBlank())
                                httpHeaders.set("X-User-Id", userId);
                            if (roles != null && !roles.isBlank())
                                httpHeaders.set("X-User-Roles", roles);
                        })
                        .build();

                return next.exchange(filtered);
            }

            return next.exchange(request);
        };

        return WebClient.builder().filter(forwardHeadersFilter);
    }
}
