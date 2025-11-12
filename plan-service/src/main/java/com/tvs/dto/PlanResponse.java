package com.tvs.dto;


import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Response DTO representing a plan with included features.
 */
@Data
public class PlanResponse {

    private UUID planId;
    private String name;
    private String description;
    private String duration;
    private List<FeatureResponse> features;
    private Double totalPrice;
    private Double discountedPrice;
    private Double discountPercentage;
    private Boolean isDiscountActive;
    private Boolean isActive;
}
