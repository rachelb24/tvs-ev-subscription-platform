package com.tvs.dto;

import lombok.Data;

@Data
public class PlanEmailRequest {
    private String userName;
    private String userEmail;
    private String planName;
    private String startDate;  // or LocalDate if preferred
}
