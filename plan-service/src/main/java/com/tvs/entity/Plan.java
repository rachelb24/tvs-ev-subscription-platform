package com.tvs.entity;

import com.tvs.util.UUIDListConverter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Data
@NoArgsConstructor
public class Plan {

    @Id
    @GeneratedValue
    private UUID planId;

    private String name;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    private Duration duration;

    @Convert(converter = UUIDListConverter.class)
    private List<UUID> featureIds;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    private Double totalPrice;      // Original price, non-discounted
    private Double discountedPrice; // Price after discount (final price)

 // src/main/java/com/tvs/entity/Plan.java
    private Double discountPercentage;  // e.g., 10 for 10%
   

    // Remove this:
    // private Double discountAmount;
 // Discount value to calculate discountedPrice
    private Boolean isDiscountActive;

    private Boolean isActive;

    public enum Duration {
        MONTH, QUARTER, YEAR
    }
}
