package com.tvs.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class UserPlanDto {
	private UUID subscriptionId;
    private UUID planId;
    private String planName;
    private String startDate;
    private String endDate;
    private Boolean isActive;
}
