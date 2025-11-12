package com.tvs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "plan_usage", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"subscription_id", "feature_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanUsage {

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
    private Integer totalUnits;

    @Builder.Default
    @Column(nullable = false)
    private Integer usedUnits = 0;
}
