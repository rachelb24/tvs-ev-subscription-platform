package com.tvs.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

@Data
public class PlanRequest {

    @NotBlank(message = "Plan name is required")
    private String name;

    private String description;

    @NotBlank(message = "Duration is required (MONTH, QUARTER, YEAR)")
    private String duration;

    @NotNull(message = "At least one feature is required")
    private List<UUID> featureIds;

    private Boolean isActive;

    private Double discountPercentage;



    private Boolean isDiscountActive;
}
