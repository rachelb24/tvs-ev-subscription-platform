package com.tvs.repository;

import com.tvs.entity.FeatureUsageHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FeatureUsageHistoryRepository extends JpaRepository<FeatureUsageHistory, UUID> {
    List<FeatureUsageHistory> findBySubscriptionIdAndFeatureNameIgnoreCaseOrderByUsedAtDesc(UUID subscriptionId, String featureName);
}

