package com.tvs.service;

import com.fasterxml.jackson.databind.JsonNode;
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

    @Value("${plan.service.url}") private String planServiceUrl;

    public boolean planExists(UUID planId) {
        try {
            String url = planServiceUrl + "/api/v1/plans/" + planId;
            webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public String getPlanName(UUID planId) {
        try {
            String url = planServiceUrl + "/api/v1/plans/" + planId;
            JsonNode node = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();
            if (node != null && node.has("name")) return node.get("name").asText();
            return null;
        } catch (Exception ex) {
            return null;
        }
    }
}
