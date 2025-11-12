package com.tvs.dto;

import lombok.Data;

@Data
public class FeatureUsageDto {
    private String featureName;
    private int totalUnits;
    private int usedUnits;
}
