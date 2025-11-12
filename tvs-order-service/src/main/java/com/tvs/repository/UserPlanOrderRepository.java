package com.tvs.repository;

import com.tvs.entity.UserPlanOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface UserPlanOrderRepository extends JpaRepository<UserPlanOrder, UUID> {
    List<UserPlanOrder> findByUserIdAndIsActiveTrue(UUID userId);
    List<UserPlanOrder> findByIsActiveTrue();
    long countByIsActiveTrue();
}
