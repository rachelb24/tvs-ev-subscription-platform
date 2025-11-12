// src/main/java/com/tvs/dto/PlanResponse.java
package com.tvs.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class PlanResponse {
    private UUID planId;
    private String name;
    private String description;
    private String duration;

    private Double totalPrice;
    private Double discountedPrice;
    private Double discountAmount;
    private Boolean isDiscountActive;
    private Boolean isActive;

    private List<FeatureResponse> features;
}
