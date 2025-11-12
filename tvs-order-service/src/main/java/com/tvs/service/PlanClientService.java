package com.tvs.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.tvs.dto.PlanResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class PlanClientService {

    private final WebClient webClient;

    @Value("${plan.service.url}")
    private String planServiceUrl;

    public PlanClientService(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    public boolean planExists(UUID planId) {
        try {
            webClient.get()
                    .uri(planServiceUrl + "/api/v1/plans/{id}", planId)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            return true;
        } catch (Exception ex) {
            return false;
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

    /**
     * NEW: Return full PlanResponse (null on error)
     */
    public PlanResponse getPlan(UUID planId) {
        try {
            Mono<PlanResponse> mono = webClient.get()
                    .uri(planServiceUrl + "/api/v1/plans/{id}", planId)
                    .retrieve()
                    .bodyToMono(PlanResponse.class);
            return mono.block();
        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        }
    }
}
