package com.tvs.dto;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Data
public class UserResponse {
    private UUID userId;
    private String fullName;
    private String email;
    private String mobile;
    private Boolean isActive;
    private List<UserPlanDto> plans;

    // Vehicle info
    private String vehicleName;
    private Integer vehicleModelYear;

    // New: vehicle number (RTO-registered)
    private String vehicleNumber;

    @Data
    public static class UserPlanDto {
        private UUID planId;
        private String planName;
        private String startDate;
        private String endDate;
        private Boolean isActive;
    }
}
