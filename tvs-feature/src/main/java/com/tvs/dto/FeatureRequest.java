package com.tvs.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class FeatureRequest {
    @NotBlank(message = "code is required")
    @Size(max = 100)
    private String code;

    @NotBlank(message = "name is required")
    @Size(max = 200)
    private String name;

    @Size(max = 2000)
    private String description;

    @NotBlank(message = "unit is required")
    @Size(max = 50)
    private String unit;

    @NotNull
    @Min(value = 0, message = "usageLimit must be >= 0")
    private Integer usageLimit;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true, message = "pricePerUnit must be >= 0")
    private Double pricePerUnit;

    @NotNull
    @Min(value = 0, message = "defaultIncludedUnits must be >= 0")
    private Integer defaultIncludedUnits;

    @NotNull
    private Boolean isActive;
}
