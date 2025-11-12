package com.tvs.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class UserDto {
    private UUID userId;
    private String fullName;
    private String email;
    private String mobile;
    private Boolean isActive;
    private List<UserPlanDto> plans;
}
