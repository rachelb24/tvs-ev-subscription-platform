package com.tvs.repository;

import com.tvs.entity.PlanUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PlanUsageRepository extends JpaRepository<PlanUsage, UUID> {
    List<PlanUsage> findBySubscriptionId(UUID subscriptionId);
    PlanUsage findBySubscriptionIdAndFeatureNameIgnoreCase(UUID subscriptionId, String featureName);
}
