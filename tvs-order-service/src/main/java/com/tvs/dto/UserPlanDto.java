package com.tvs.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class UserPlanDto {
	private UUID id; // add getter/setter

    private UUID planId;
    private String planName;
    private String description;
    private String duration;
    private String startDate;
    private String endDate;
    private Boolean isActive;
    private String createdAt;
    private UUID userId;
    private String userName;  
    private Double totalPrice;
    private Double discountedPrice;
    private Double discountAmount;
    private Boolean isDiscountActive;
    private Boolean isPlanActive;

    private List<FeatureResponse> features;
}
