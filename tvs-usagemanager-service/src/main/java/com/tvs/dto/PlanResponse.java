package com.tvs.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class PlanResponse {

    @JsonProperty("id")
    private UUID planId;

    private String name;
    private String description;

    // ✅ FIXED: must be String since Plan microservice sends plain "MONTH"/"QUARTER"/"YEAR"
    private String duration;

    private List<FeatureResponse> features;
    private Double totalPrice;
    private Double discountedPrice;
}
