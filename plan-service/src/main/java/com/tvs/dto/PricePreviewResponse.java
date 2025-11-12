package com.tvs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Response DTO for price preview before saving a plan.
 */
@Data
@AllArgsConstructor
public class PricePreviewResponse {
    private Double totalPrice;
}
