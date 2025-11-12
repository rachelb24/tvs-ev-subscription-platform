package com.tvs.service;

import com.tvs.entity.FeatureUsageHistory;
import com.tvs.entity.PlanUsage;
import com.tvs.entity.UserSubscription;
import com.tvs.repository.FeatureUsageHistoryRepository;
import com.tvs.repository.PlanUsageRepository;
import com.tvs.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Service to manage plan usage and feature consumption for user subscriptions.
 */
@Service
@RequiredArgsConstructor
public class PlanUsageService {

    private final PlanUsageRepository planUsageRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final FeatureUsageHistoryRepository featureUsageHistoryRepository;
    private final WebClient.Builder webClientBuilder;

    private static final String PLAN_SERVICE_URL = "http://localhost:8081/api/v1/plans/";

    /**
     * Initializes usage entries for all features in a plan.
     */
    public List<PlanUsage> initializeUsage(UUID subscriptionId, UUID planId) {
        Map<String, Object> plan;
        try {
            plan = webClientBuilder.build()
                    .get()
                    .uri(PLAN_SERVICE_URL + planId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
        } catch (WebClientResponseException e) {
            throw new RuntimeException("Failed to fetch plan details: " + e.getMessage(), e);
        }

        if (plan == null) {
            throw new RuntimeException("Plan not found: " + planId);
        }

        Object featuresObj = plan.get("features");
        if (!(featuresObj instanceof List<?> features)) {
            throw new RuntimeException("Invalid or missing features for plan: " + planId);
        }

        List<PlanUsage> usageList = new ArrayList<>();
        for (Object f : features) {
            if (!(f instanceof Map<?, ?> feature)) continue;

            String featureIdStr = Objects.toString(feature.get("featureId"), null);
            String featureName = Objects.toString(feature.get("name"), "").trim();

            if (featureIdStr == null || featureName.isEmpty()) {
                throw new RuntimeException("Invalid feature data in plan response.");
            }

            int defaultUnits = 0;
            Object defaultUnitsObj = feature.get("defaultIncludedUnits");
            if (defaultUnitsObj instanceof Number num) {
                defaultUnits = num.intValue();
            }

            PlanUsage usage = PlanUsage.builder()
                    .subscriptionId(subscriptionId)
                    .featureId(UUID.fromString(featureIdStr))
                    .featureName(featureName)
                    .totalUnits(defaultUnits)
                    .usedUnits(0)
                    .build();

            usageList.add(planUsageRepository.save(usage));
        }

        return usageList;
    }

    /**
     * Returns the subscription details for a given ID.
     */
    public UserSubscription getSubscription(UUID subscriptionId) {
        return subscriptionRepository.findById(subscriptionId).orElse(null);
    }

    /**
     * Returns the active subscription for a given user.
     */
    public Optional<UserSubscription> getActiveSubscriptionForUser(UUID userId) {
        return subscriptionRepository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .findFirst();
    }

    /**
     * Returns usage data for a subscription, initializing if missing.
     */
    public List<PlanUsage> getUsage(UUID subscriptionId) {
        UserSubscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found: " + subscriptionId));

        List<PlanUsage> usageList = planUsageRepository.findBySubscriptionId(subscriptionId);
        if (usageList.isEmpty()) {
            usageList = initializeUsage(subscriptionId, subscription.getPlanId());
        }

        return usageList;
    }

    /**
     * Consumes units for a feature, records the usage history, and ensures transactional consistency.
     */
    @Transactional
    public boolean consumeUnits(UUID subscriptionId, String featureName, int unitsNeeded) {
        featureName = featureName.trim();

        PlanUsage usage = planUsageRepository.findBySubscriptionIdAndFeatureNameIgnoreCase(subscriptionId, featureName);
        if (usage == null) {
            throw new RuntimeException("Feature not found: " + featureName);
        }

        if (usage.getUsedUnits() + unitsNeeded > usage.getTotalUnits()) {
            return false; // Insufficient units
        }

        usage.setUsedUnits(usage.getUsedUnits() + unitsNeeded);
        planUsageRepository.save(usage);

        FeatureUsageHistory history = FeatureUsageHistory.builder()
                .subscriptionId(subscriptionId)
                .featureId(usage.getFeatureId())
                .featureName(featureName)
                .unitsUsed(unitsNeeded)
                .usedAt(LocalDateTime.now())
                .build();

        featureUsageHistoryRepository.save(history);
        return true;
    }

    /**
     * Retrieves the usage history for a specific feature in a subscription.
     */
    public List<FeatureUsageHistory> getFeatureHistory(UUID subscriptionId, String featureName) {
        return featureUsageHistoryRepository
                .findBySubscriptionIdAndFeatureNameIgnoreCaseOrderByUsedAtDesc(subscriptionId, featureName);
    }
}
