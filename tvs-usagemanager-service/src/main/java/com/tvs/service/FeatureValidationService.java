package com.tvs.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeatureValidationService {

    private final PlanUsageService planUsageService;

    /**
     * Book any feature by consuming units from PlanUsage.
     */
    public boolean bookFeature(UUID subscriptionId, String featureCode) {
        // Consume 1 unit from PlanUsage
        return planUsageService.consumeUnits(subscriptionId, featureCode, 1);
    }
}
