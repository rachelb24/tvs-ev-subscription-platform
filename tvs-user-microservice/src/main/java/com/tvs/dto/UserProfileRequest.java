package com.tvs.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
public class UserProfileRequest {
    @NotBlank private String fullName;
    @NotBlank @Email private String email;
    private String mobile;

    private String vehicleName;
    private Integer vehicleModelYear;

    // New: vehicle no for profile update
    private String vehicleNo;
    private Boolean isActive; // ✅ add this

}
