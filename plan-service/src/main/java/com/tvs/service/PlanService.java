package com.tvs.service;

import com.tvs.dto.FeatureResponse;
import com.tvs.dto.PlanRequest;
import com.tvs.dto.PlanResponse;
import com.tvs.entity.Plan;
import com.tvs.exception.PlanNotFoundException;
import com.tvs.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanService {
	// ✅ Count total number of plans
	public long countPlans() {
	    return planRepository.count();
	}


    private final PlanRepository planRepository;
    private final FeatureClientService featureClientService;

    public PlanResponse createPlan(PlanRequest planRequest) {
        Plan plan = new Plan();
        plan.setName(planRequest.getName());
        plan.setDescription(planRequest.getDescription());

        Plan.Duration durationEnum;
        try {
            durationEnum = Plan.Duration.valueOf(planRequest.getDuration());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid duration value");
        }
        plan.setDuration(durationEnum);

        plan.setFeatureIds(planRequest.getFeatureIds());
        plan.setIsActive(planRequest.getIsActive() != null ? planRequest.getIsActive() : true);

        // Set discount fields
        plan.setDiscountPercentage(planRequest.getDiscountPercentage());
        plan.setIsDiscountActive(planRequest.getIsDiscountActive());

        List<FeatureResponse> features = featureClientService.getFeaturesByIds(plan.getFeatureIds());

        double monthlyFee = features.stream()
                .mapToDouble(FeatureResponse::getPricePerUnit)
                .sum();

        int multiplier = getDurationMultiplier(durationEnum);

        double originalPrice = monthlyFee * multiplier;

        if ("Free".equalsIgnoreCase(plan.getName())) {
            originalPrice = 0.0;
        }

        plan.setTotalPrice(originalPrice);

        double discountedPrice = originalPrice;
        if (Boolean.TRUE.equals(plan.getIsDiscountActive()) && plan.getDiscountPercentage() != null) {
            discountedPrice = Math.max(0, originalPrice - (originalPrice * plan.getDiscountPercentage() / 100));
        }

        plan.setDiscountedPrice(discountedPrice);

        plan.setCreatedAt(LocalDateTime.now());
        plan.setExpiresAt(plan.getCreatedAt().plusMonths(multiplier));

        plan = planRepository.save(plan);

        List<FeatureResponse> adjustedFeatures = multiplyFeatureUnits(features, multiplier);

        return toPlanResponse(plan, adjustedFeatures);
    }

    public PlanResponse updatePlan(UUID planId, PlanRequest planRequest) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new PlanNotFoundException("Plan not found with id: " + planId));

        if (planRequest.getName() != null) plan.setName(planRequest.getName());
        if (planRequest.getDescription() != null) plan.setDescription(planRequest.getDescription());
        if (planRequest.getDuration() != null) {
            try {
                plan.setDuration(Plan.Duration.valueOf(planRequest.getDuration()));
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid duration value");
            }
        }
        if (planRequest.getFeatureIds() != null && !planRequest.getFeatureIds().isEmpty()) {
            plan.setFeatureIds(planRequest.getFeatureIds());
        }
        if (planRequest.getIsActive() != null) {
            plan.setIsActive(planRequest.getIsActive());
        }

        if (planRequest.getDiscountPercentage() != null) {
            plan.setDiscountPercentage(planRequest.getDiscountPercentage());
        }
        if (planRequest.getIsDiscountActive() != null) {
            plan.setIsDiscountActive(planRequest.getIsDiscountActive());
        }

        List<FeatureResponse> features = featureClientService.getFeaturesByIds(plan.getFeatureIds());

        int multiplier = getDurationMultiplier(plan.getDuration());

        double monthlyFee = features.stream()
                .mapToDouble(FeatureResponse::getPricePerUnit)
                .sum();

        double originalPrice = monthlyFee * multiplier;

        if ("Free".equalsIgnoreCase(plan.getName())) {
            originalPrice = 0.0;
        }

        plan.setTotalPrice(originalPrice);

        double discountedPrice = originalPrice;
        if (Boolean.TRUE.equals(plan.getIsDiscountActive()) && plan.getDiscountPercentage() != null) {
            discountedPrice = Math.max(0, originalPrice - (originalPrice * plan.getDiscountPercentage() / 100));
        }

        plan.setDiscountedPrice(discountedPrice);

        plan = planRepository.save(plan);

        List<FeatureResponse> adjustedFeatures = multiplyFeatureUnits(features, multiplier);

        return toPlanResponse(plan, adjustedFeatures);
    }

    public PlanResponse getPlanById(UUID planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new PlanNotFoundException("Plan not found with id: " + planId));
        List<FeatureResponse> features = featureClientService.getFeaturesByIds(plan.getFeatureIds());

        int multiplier = getDurationMultiplier(plan.getDuration());
        List<FeatureResponse> adjustedFeatures = multiplyFeatureUnits(features, multiplier);

        return toPlanResponse(plan, adjustedFeatures);
    }

    public List<PlanResponse> getAllPlans() {
        List<Plan> plans = planRepository.findAll();
        return plans.stream()
                .map(this::mapToPlanResponseWithFeatures)
                .collect(Collectors.toList());
    }

    public List<PlanResponse> getActivePlans() {
        List<Plan> plans = planRepository.findAll();
        return plans.stream()
                .filter(plan -> Boolean.TRUE.equals(plan.getIsActive()))
                .map(this::mapToPlanResponseWithFeatures)
                .collect(Collectors.toList());
    }

    public void deletePlan(UUID planId) {
        if (!planRepository.existsById(planId)) {
            throw new PlanNotFoundException("Plan not found with id: " + planId);
        }
        planRepository.deleteById(planId);
    }

    public PlanResponse activatePlan(UUID planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new PlanNotFoundException("Plan not found with id: " + planId));
        plan.setIsActive(true);
        plan = planRepository.save(plan);
        List<FeatureResponse> features = featureClientService.getFeaturesByIds(plan.getFeatureIds());

        int multiplier = getDurationMultiplier(plan.getDuration());
        List<FeatureResponse> adjustedFeatures = multiplyFeatureUnits(features, multiplier);

        return toPlanResponse(plan, adjustedFeatures);
    }

    public PlanResponse deactivatePlan(UUID planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new PlanNotFoundException("Plan not found with id: " + planId));
        plan.setIsActive(false);
        plan = planRepository.save(plan);
        List<FeatureResponse> features = featureClientService.getFeaturesByIds(plan.getFeatureIds());

        int multiplier = getDurationMultiplier(plan.getDuration());
        List<FeatureResponse> adjustedFeatures = multiplyFeatureUnits(features, multiplier);

        return toPlanResponse(plan, adjustedFeatures);
    }

    public Double calculatePrice(List<UUID> featureIds) {
        List<FeatureResponse> features = featureClientService.getFeaturesByIds(featureIds);
        return features.stream()
                .mapToDouble(FeatureResponse::getPricePerUnit)
                .sum();
    }

    private PlanResponse toPlanResponse(Plan plan, List<FeatureResponse> features) {
        PlanResponse response = new PlanResponse();
        response.setPlanId(plan.getPlanId());
        response.setName(plan.getName());
        response.setDescription(plan.getDescription());
        response.setDuration(plan.getDuration().name());
        response.setFeatures(features);
        response.setTotalPrice(plan.getTotalPrice());
        response.setDiscountedPrice(plan.getDiscountedPrice());
        response.setDiscountPercentage(plan.getDiscountPercentage());
        response.setIsDiscountActive(plan.getIsDiscountActive());
        response.setIsActive(plan.getIsActive());

        return response;
    }

    private PlanResponse mapToPlanResponseWithFeatures(Plan plan) {
        List<FeatureResponse> features = featureClientService.getFeaturesByIds(plan.getFeatureIds());

        int multiplier = getDurationMultiplier(plan.getDuration());
        List<FeatureResponse> adjustedFeatures = multiplyFeatureUnits(features, multiplier);

        return toPlanResponse(plan, adjustedFeatures);
    }

    // Helper method: multiply defaultIncludedUnits by multiplier
    private List<FeatureResponse> multiplyFeatureUnits(List<FeatureResponse> features, int multiplier) {
        return features.stream()
                .map(f -> {
                    FeatureResponse fr = new FeatureResponse();
                    fr.setFeatureId(f.getFeatureId());
                    fr.setCode(f.getCode());
                    fr.setName(f.getName());
                    fr.setDescription(f.getDescription());
                    fr.setUnit(f.getUnit());
                    fr.setUsageLimit(f.getUsageLimit());
                    fr.setPricePerUnit(f.getPricePerUnit());
                    fr.setDefaultIncludedUnits(f.getDefaultIncludedUnits() * multiplier);
                    fr.setIsActive(f.getIsActive());
                    return fr;
                })
                .collect(Collectors.toList());
    }

    private int getDurationMultiplier(Plan.Duration duration) {
        if (duration == null) return 1;
        return switch (duration) {
            case MONTH -> 1;
            case QUARTER -> 3;
            case YEAR -> 12;
        };
    }


	public long getPlanCount() {
		// TODO Auto-generated method stub
		return planRepository.count();
	}

}
