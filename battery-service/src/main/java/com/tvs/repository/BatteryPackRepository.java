package com.tvs.repository;


import com.tvs.model.BatteryPack;
import com.tvs.model.BatteryStatus;
import com.tvs.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BatteryPackRepository extends JpaRepository<BatteryPack, Long> {

    // Find batteries by location and status
    List<BatteryPack> findByLocationAndStatus(Location location, BatteryStatus status);

    // Find batteries by location only
    List<BatteryPack> findByLocation(Location location);

    // Find batteries by status only
    List<BatteryPack> findByStatus(BatteryStatus status);
}
