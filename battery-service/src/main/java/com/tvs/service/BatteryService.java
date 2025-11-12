package com.tvs.service;

import com.tvs.exception.InsufficientInventoryException;
import com.tvs.exception.NotFoundException;
import com.tvs.model.*;
import com.tvs.repository.BatteryPackRepository;
import com.tvs.repository.LocationRepository;
import com.tvs.repository.SwapEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class BatteryService {

    @Autowired
    private BatteryPackRepository batteryPackRepo;
    @Autowired
    private LocationRepository locationRepo;
    @Autowired
    private SwapEventRepository swapEventRepo;

    // Create new location
    public Location createLocation(Location location) {
        // Basic validation could be added here
        return locationRepo.save(location);
    }

    // Get all locations with battery counts
    public List<Map<String, Object>> getLocationsInventory() {
        List<Location> locations = locationRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Location loc : locations) {
            List<BatteryPack> charged = batteryPackRepo.findByLocationAndStatus(loc, BatteryStatus.CHARGED);
            int chargedCount = charged.size();

            List<BatteryPack> total = batteryPackRepo.findByLocation(loc);
            int totalCount = total.size();

            Map<String, Object> map = new HashMap<>();
            map.put("locationId", loc.getId());
            map.put("name", loc.getName());
            map.put("address", loc.getAddress());
            map.put("chargedCount", chargedCount);
            map.put("totalCount", totalCount);

            result.add(map);
        }
        return result;
    }

    // Create new battery pack assigned to a location
    public BatteryPack createBatteryPack(BatteryPack batteryPack, Long locationId) {
        Location location = locationRepo.findById(locationId).orElseThrow(() -> new NotFoundException("Location not found"));
        batteryPack.setLocation(location);
        // Default healthPercent and status if missing
        if (batteryPack.getHealthPercent() == null) {
            batteryPack.setHealthPercent(100);
        }
        if (batteryPack.getStatus() == null) {
            batteryPack.setStatus(BatteryStatus.CHARGED);
        }
        return batteryPackRepo.save(batteryPack);
    }

    // Get battery packs with optional filters on location and status
    public List<BatteryPack> getBatteryPacks(Long locationId, String statusStr) {
        BatteryStatus status = null;
        if (StringUtils.hasText(statusStr)) {
            try {
                status = BatteryStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid battery status: " + statusStr);
            }
        }
        if (locationId != null && status != null) {
            Location location = locationRepo.findById(locationId).orElseThrow(() -> new NotFoundException("Location not found"));
            return batteryPackRepo.findByLocationAndStatus(location, status);
        } else if (locationId != null) {
            Location location = locationRepo.findById(locationId).orElseThrow(() -> new NotFoundException("Location not found"));
            return batteryPackRepo.findByLocation(location);
        } else if (status != null) {
            return batteryPackRepo.findByStatus(status);
        }
        return batteryPackRepo.findAll();
    }

    // Get current battery status for given user - latest assigned battery in use or reserved
    public BatteryPack getBatteryStatusForUser(String userId) {
        List<SwapEvent> swaps = swapEventRepo.findByUserId(userId);
        if (swaps.isEmpty()) {
            throw new NotFoundException("No swap history for user " + userId);
        }
        // Assuming latest SwapEvent with BORROWED or RESERVED battery is the current in-use
        swaps.sort(Comparator.comparing(SwapEvent::getSwapTime).reversed());
        for (SwapEvent se : swaps) {
            if (se.getAction() == SwapAction.BORROWED) {
                BatteryPack bp = se.getBatteryPack();
                if (bp.getStatus() == BatteryStatus.IN_USE || bp.getStatus() == BatteryStatus.RESERVED) {
                    return bp;
                }
            }
        }
        throw new NotFoundException("No active battery for user " + userId);
    }

    // Book a battery swap - reserve a charged battery at location for user
    public BatteryPack bookSwap(String userId, Long locationId) {
        Location location = locationRepo.findById(locationId)
                .orElseThrow(() -> new NotFoundException("Location not found"));

        List<BatteryPack> available = batteryPackRepo.findByLocationAndStatus(location, BatteryStatus.CHARGED);
        if (available.isEmpty())
            throw new InsufficientInventoryException("No charged batteries available at this location");

        BatteryPack battery = available.get(0);
        battery.setStatus(BatteryStatus.RESERVED);
        batteryPackRepo.save(battery);

        SwapEvent event = new SwapEvent();
        event.setUserId(userId);
        event.setBatteryPack(battery);
        event.setFromLocation(location);
        event.setToLocation(location); // Initially same location
        event.setSwapTime(LocalDateTime.now());
        event.setAction(SwapAction.BORROWED);
        swapEventRepo.save(event);

        return battery;
    }

    // Get swap history for a user or battery
    public List<SwapEvent> getSwapHistory(String userId, Long batteryId) {
        if (userId != null) {
            return swapEventRepo.findByUserId(userId);
        }
        if (batteryId != null) {
            return swapEventRepo.findByBatteryPackId(batteryId);
        }
        return swapEventRepo.findAll();
    }

    // Update battery pack fields partially - status, healthPercent, location
    public BatteryPack updateBatteryPack(Long id, BatteryPack updated) {
        BatteryPack existing = batteryPackRepo.findById(id).orElseThrow(() -> new NotFoundException("Battery pack not found"));

        if (updated.getStatus() != null) {
            existing.setStatus(updated.getStatus());
        }
        if (updated.getHealthPercent() != null) {
            existing.setHealthPercent(updated.getHealthPercent());
        }
        if (updated.getLocation() != null) {
            Long locId = updated.getLocation().getId();
            Location location = locationRepo.findById(locId).orElseThrow(() -> new NotFoundException("Location not found"));
            existing.setLocation(location);
        }
        return batteryPackRepo.save(existing);
    }
}
