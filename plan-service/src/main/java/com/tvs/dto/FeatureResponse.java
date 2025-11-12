package com.tvs.dto;


import lombok.Data;

import java.util.UUID;

@Data
public class FeatureResponse {
    private UUID featureId;
    private String code;
    private String name;
    private String description;
    private String unit;
    private Integer usageLimit;
    private Double pricePerUnit;
    private Integer defaultIncludedUnits;
    private Boolean isActive;
}
