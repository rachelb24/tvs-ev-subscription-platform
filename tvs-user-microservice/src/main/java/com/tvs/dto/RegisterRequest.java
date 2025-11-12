package com.tvs.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
    private String fullName;
    private String email;
    private String mobile;
    private String password;

    // New vehicle fields
    private String vehicleName;
    private Integer vehicleModelYear;

    // New: vehicle number (entered by user) to validate against vehicle_no table
    private String vehicleNo;
}
