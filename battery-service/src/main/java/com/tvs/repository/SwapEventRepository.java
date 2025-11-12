package com.tvs.repository;

import com.tvs.model.SwapEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SwapEventRepository extends JpaRepository<SwapEvent, Long> {

    // Find swaps by userId
    List<SwapEvent> findByUserId(String userId);

    // Find swaps by batteryPack id
    List<SwapEvent> findByBatteryPackId(Long batteryPackId);
}
