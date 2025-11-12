package com.tvs.service;

import com.tvs.entity.UserPlanOrder;
import com.tvs.repository.UserPlanOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderExpiryService {

    private final UserPlanOrderRepository repository;

    /** ✅ Runs every day at midnight */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void deactivateExpiredOrders() {
        List<UserPlanOrder> activeOrders = repository.findByIsActiveTrue();
        LocalDate today = LocalDate.now();

        for (UserPlanOrder order : activeOrders) {
            if (order.getEndDate() != null && order.getEndDate().isBefore(today)) {
                order.setIsActive(false);
                order.setUpdatedAt(LocalDateTime.now());
                repository.save(order);
            }
        }
    }
}