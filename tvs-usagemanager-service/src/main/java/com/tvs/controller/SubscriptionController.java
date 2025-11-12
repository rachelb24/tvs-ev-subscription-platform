package com.tvs.controller;

import com.tvs.dto.PlanResponse;
import com.tvs.dto.UserPlanDto;
import com.tvs.entity.UserSubscription;
import com.tvs.service.PlanClientService;
import com.tvs.service.PlanUsageService;
import com.tvs.service.SubscriptionService;
import com.tvs.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final JwtUtils jwtUtils;
    private final PlanClientService planClientService;
    private final PlanUsageService planUsageService;

    @PostMapping("/{userId}/assign/{planId}")
    public ResponseEntity<?> assignSubscription(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID userId,
            @PathVariable UUID planId,
            @RequestParam(required = false) String startDate
    ) {
        validateUserAccess(authHeader, userId);

        // Fetch plan details
        PlanResponse plan = planClientService.getPlan(planId);
        if (plan == null) {
            return ResponseEntity.badRequest().body("Plan not found for ID: " + planId);
        }

        // Determine start date
        LocalDate start = (startDate != null) ? LocalDate.parse(startDate) : LocalDate.now();

        // Determine end date based on duration in plan
        LocalDate end;
        String duration = (plan.getDuration() != null)
                ? plan.getDuration().trim().toUpperCase()
                : "MONTH"; // default

        switch (duration) {
            case "QUARTER" -> end = start.plusMonths(3);
            case "YEAR" -> end = start.plusYears(1);
            default -> end = start.plusMonths(1); // default to 1 month
        }
        // Step 1: Save subscription
        UserSubscription sub = subscriptionService.assignSubscription(userId, planId, start, end);

        // Step 2: Initialize usage for features in plan
        try {
            planUsageService.initializeUsage(sub.getId(), planId);
        } catch (Exception e) {
            log.error("Failed to initialize usage for subscription {}: {}", sub.getId(), e.getMessage());
        }

        // Step 3: Prepare response DTO
        UserPlanDto dto = new UserPlanDto();
        dto.setSubscriptionId(sub.getId());
        dto.setPlanId(sub.getPlanId());
        dto.setPlanName(plan.getName());
        dto.setStartDate(start.toString());
        dto.setEndDate(end.toString());
        dto.setIsActive(sub.getIsActive());

        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{userId}/cancel/{planId}")
    public ResponseEntity<String> cancelSubscription(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID userId,
            @PathVariable UUID planId
    ) {
        validateUserAccess(authHeader, userId);
        subscriptionService.cancelSubscription(userId, planId);
        return ResponseEntity.ok("Subscription cancelled successfully");
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<UserSubscription>> getSubscriptions(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID userId
    ) {
        validateUserAccess(authHeader, userId);
        List<UserSubscription> subs = subscriptionService.getActiveSubscriptions(userId);
        return ResponseEntity.ok(subs);
    }
    @PostMapping("/{userId}/assign-free/{planId}")
    public ResponseEntity<?> assignFreeSubscription(
            @PathVariable UUID userId,
            @PathVariable UUID planId,
            @RequestParam(required = false) String startDate
    ) {
        // Fetch plan details
        PlanResponse plan = planClientService.getPlan(planId);
        if (plan == null) {
            return ResponseEntity.badRequest().body("Plan not found for ID: " + planId);
        }

        // Determine start date
        LocalDate start = (startDate != null) ? LocalDate.parse(startDate) : LocalDate.now();

        // Determine end date based on duration in plan
        LocalDate end;
        String duration = (plan.getDuration() != null)
                ? plan.getDuration().trim().toUpperCase()
                : "MONTH"; // default

        switch (duration) {
            case "QUARTER" -> end = start.plusMonths(3);
            case "YEAR" -> end = start.plusYears(1);
            default -> end = start.plusMonths(1); // default to 1 month
        }

        // Step 1: Save subscription
        UserSubscription sub = subscriptionService.assignSubscription(userId, planId, start, end);

        // Step 2: Initialize usage for features in plan
        try {
            planUsageService.initializeUsage(sub.getId(), planId);
        } catch (Exception e) {
            log.error("Failed to initialize usage for subscription {}: {}", sub.getId(), e.getMessage());
        }

        // Step 3: Prepare response DTO
        UserPlanDto dto = new UserPlanDto();
        dto.setSubscriptionId(sub.getId());
        dto.setPlanId(sub.getPlanId());
        dto.setPlanName(plan.getName());
        dto.setStartDate(start.toString());
        dto.setEndDate(end.toString());
        dto.setIsActive(sub.getIsActive());

        return ResponseEntity.ok(dto);
    }


    // --- Utility methods ---
    private void validateUserAccess(String authHeader, UUID pathUserId) {
        try {
            String email = jwtUtils.extractEmail(authHeader);
            UUID actualUserId = fetchUserIdByEmail(email);

            if (!actualUserId.equals(pathUserId)) {
                throw new RuntimeException("Forbidden: User mismatch");
            }
        } catch (Exception ex) {
            log.error("JWT validation failed: {}", ex.getMessage());
            throw new RuntimeException("Unauthorized or invalid token");
        }
    }

    private UUID fetchUserIdByEmail(String email) {
        try {
            return WebClient.create()
                    .get()
                    .uri("http://localhost:9003/api/users/by-email/{email}", email)
                    .retrieve()
                    .bodyToMono(UUID.class)
                    .block();
        } catch (Exception ex) {
            log.error("Failed to fetch userId for email {}: {}", email, ex.getMessage());
            throw new RuntimeException("Unable to verify user identity");
        }
    }
}
