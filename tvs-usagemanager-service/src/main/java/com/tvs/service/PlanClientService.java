package com.tvs.service;

import com.tvs.dto.PlanResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlanClientService {

    private final WebClient.Builder webClientBuilder;

    @Value("${plan.service.url}")
    private String planServiceUrl;

    private WebClient getWebClient() {
        return webClientBuilder.baseUrl(planServiceUrl).build();
    }

    public boolean planExists(UUID planId) {
        try {
            return getWebClient().get()
                    .uri("/api/v1/plans/{id}", planId)
                    .exchangeToMono(response -> {
                        if (response.statusCode().is2xxSuccessful()) return Mono.just(true);
                        if (response.statusCode().is4xxClientError()) return Mono.just(false);
                        return Mono.just(false);
                    }).block();
        } catch (Exception ex) {
            return false;
        }
    }

    public PlanResponse getPlan(UUID planId) {
        try {
            return getWebClient().get()
                    .uri("/api/v1/plans/{id}", planId)
                    .retrieve()
                    .bodyToMono(PlanResponse.class)
                    .block();
        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        }
    }

    public String getPlanName(UUID planId) {
        PlanResponse p = getPlan(planId);
        return p != null ? p.getName() : null;
    }

    public Double getPlanPrice(UUID planId) {
        PlanResponse p = getPlan(planId);
        if (p == null) return null;
        return p.getDiscountedPrice() != null ? p.getDiscountedPrice() : p.getTotalPrice();
    }
}
