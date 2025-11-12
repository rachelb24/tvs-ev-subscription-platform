package com.tvs.service;

import com.tvs.dto.UserResponse.UserPlanDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderClientService {

    private final WebClient.Builder webClientBuilder;

    @Value("${order.service.url}")
    private String orderServiceUrl;

    public List<UserPlanDto> getActivePlans(UUID userId) {
        try {
            UserPlanDto[] plans = webClientBuilder.build()
                    .get()
                    .uri(orderServiceUrl + "/api/orders/{userId}/plans", userId)
                    .retrieve()
                    .bodyToMono(UserPlanDto[].class)
                    .block();

            return plans != null ? Arrays.asList(plans) : List.of();
        } catch (Exception ex) {
            ex.printStackTrace();
            return List.of();
        }
    }

    public void assignPlan(UUID userId, UUID planId, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        try {
            webClientBuilder.build()
                    .post()
                    .uri(uriBuilder -> uriBuilder
                            .path(orderServiceUrl + "/api/orders/{userId}/assign/{planId}")
                            .queryParam("startDate", startDate.toString())
                            .queryParam("endDate", endDate.toString())
                            .build(userId, planId))
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();
        } catch (Exception ex) {
            ex.printStackTrace();
        }
    }
}
