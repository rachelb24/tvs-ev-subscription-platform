package com.tvs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "feature_usage_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureUsageHistory {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID subscriptionId;

    @Column(nullable = false)
    private UUID featureId;

    @Column(nullable = false)
    private String featureName;

    @Column(nullable = false)
    private Integer unitsUsed;

    @Column(nullable = false)
    private LocalDateTime usedAt;
}
