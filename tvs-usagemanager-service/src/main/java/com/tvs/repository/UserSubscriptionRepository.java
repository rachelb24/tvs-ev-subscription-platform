package com.tvs.repository;

import com.tvs.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, UUID> {
    List<UserSubscription> findByUserIdAndIsActiveTrue(UUID userId);
    List<UserSubscription> findByEndDateBeforeAndIsActiveTrue(LocalDate date);
    List<UserSubscription> findByUserIdAndIsActiveTrueAndEndDateAfter(UUID userId, LocalDate today);

}
