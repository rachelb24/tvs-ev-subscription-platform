package com.tvs.controller;

import com.tvs.entity.FeatureUsageHistory;
import com.tvs.entity.PlanUsage;
import com.tvs.entity.UserSubscription;
import com.tvs.service.PlanUsageService;
import com.tvs.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/plan-usage")
@RequiredArgsConstructor
public class PlanUsageController {

    private final PlanUsageService planUsageService;
    private final JwtUtils jwtUtils;

    // ✅ Initialize usage for a given subscription and plan (this was missing)
    @PostMapping("/initialize/{subscriptionId}/{planId}")
    public ResponseEntity<?> initializeUsage(
            @PathVariable UUID subscriptionId,
            @PathVariable UUID planId
    ) {
        try {
            List<PlanUsage> usageList = planUsageService.initializeUsage(subscriptionId, planId);
            return ResponseEntity.ok(usageList);
        } catch (Exception e) {
            log.error("Error initializing usage for subscription {} and plan {}: {}", subscriptionId, planId, e.getMessage());
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Get all usage records for a subscription
    @GetMapping("/{subscriptionId}")
    public ResponseEntity<?> getUsage(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID subscriptionId) {
        try {
            validateSubscriptionAccess(authHeader, subscriptionId);
            UserSubscription sub = planUsageService.getSubscription(subscriptionId);
            if (sub == null)
                return ResponseEntity.status(404).body(Map.of("error", "Subscription not found"));

            List<PlanUsage> usage = planUsageService.getUsage(subscriptionId);
            return ResponseEntity.ok(usage);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Get history of a feature usage for a given subscription
    @GetMapping("/{subscriptionId}/feature/{featureName}/history")
    public ResponseEntity<?> getFeatureHistory(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID subscriptionId,
            @PathVariable String featureName) {
        try {
            validateSubscriptionAccess(authHeader, subscriptionId);
            List<FeatureUsageHistory> history = planUsageService.getFeatureHistory(subscriptionId, featureName);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Consume a feature
    @PostMapping("/consume")
    public ResponseEntity<?> consumeFeature(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> body) {

        try {
            String featureName = Objects.toString(body.get("featureName"), null);
            if (featureName == null)
                return ResponseEntity.badRequest().body(Map.of("error", "Missing field: featureName"));

            UUID subscriptionId;
            if (body.containsKey("subscriptionId")) {
                subscriptionId = UUID.fromString(body.get("subscriptionId").toString());
                validateSubscriptionAccess(authHeader, subscriptionId);
            } else if (body.containsKey("userId")) {
                UUID userId = UUID.fromString(body.get("userId").toString());
                validateUserAccess(authHeader, userId);
                Optional<UserSubscription> subOpt = planUsageService.getActiveSubscriptionForUser(userId);
                if (subOpt.isEmpty())
                    return ResponseEntity.badRequest().body(Map.of("error", "No active subscription for user"));
                subscriptionId = subOpt.get().getId();
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing subscriptionId or userId"));
            }

            boolean success = planUsageService.consumeUnits(subscriptionId, featureName, 1);
            if (!success)
                return ResponseEntity.badRequest().body(Map.of("error", "Insufficient credits for feature: " + featureName));

            return ResponseEntity.ok(Map.of("message", "Feature '" + featureName + "' consumed successfully."));
        } catch (Exception e) {
            log.error("Error consuming feature: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    //  Utility: Validate user-subscription ownership
    private void validateSubscriptionAccess(String authHeader, UUID subscriptionId) {
        try {
            String email = jwtUtils.extractEmail(authHeader);
            UUID actualUserId = fetchUserIdByEmail(email);
            UserSubscription sub = planUsageService.getSubscription(subscriptionId);
            if (sub == null || !sub.getUserId().equals(actualUserId)) {
                throw new RuntimeException("Forbidden: Subscription does not belong to user");
            }
        } catch (Exception ex) {
            throw new RuntimeException("Unauthorized or invalid token");
        }
    }

    //  Utility: Validate user ID in token
    private void validateUserAccess(String authHeader, UUID userId) {
        try {
            String email = jwtUtils.extractEmail(authHeader);
            UUID actualUserId = fetchUserIdByEmail(email);
            if (!actualUserId.equals(userId))
                throw new RuntimeException("Forbidden: User mismatch");
        } catch (Exception ex) {
            throw new RuntimeException("Unauthorized or invalid token");
        }
    }

    //  Fetch userId by email via user-service
    private UUID fetchUserIdByEmail(String email) {
        try {
            return WebClient.create()
                    .get()
                    .uri("http://localhost:9003/api/users/by-email/{email}", email)
                    .retrieve()
                    .bodyToMono(UUID.class)
                    .block();
        } catch (Exception ex) {
            throw new RuntimeException("Unable to fetch userId for email: " + ex.getMessage());
        }
    }
}
