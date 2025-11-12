package com.tvs.service;


import com.tvs.dto.FeatureResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Client service to communicate with Feature Microservice using WebClient.
 * Fetches active features and filters them by the requested featureIds.
 */
@Service
@RequiredArgsConstructor
public class FeatureClientService {

    private final WebClient webClient;

    @Value("${feature.service.url}")
    private String featureServiceUrl;

    /**
     * Fetches active features from Feature Service and filters those matching the given featureIds.
     *
     * @param featureIds List of UUID from Plan
     * @return List of FeatureResponse DTOs matching featureIds and active status
     */
    public List<FeatureResponse> getFeaturesByIds(List<UUID> featureIds) {
        String url = featureServiceUrl + "/api/v1/features/active";
        Mono<FeatureResponse[]> responseMono = webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(FeatureResponse[].class);

        FeatureResponse[] features = responseMono.block();  // blocking call to simplify example here

        if (features == null) {
            return List.of();
        }
        return Arrays.stream(features)
                .filter(f -> featureIds.contains(f.getFeatureId()) && Boolean.TRUE.equals(f.getIsActive()))
                .collect(Collectors.toList());
    }
}
