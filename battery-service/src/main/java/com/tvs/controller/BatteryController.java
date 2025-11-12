package com.tvs.controller;

import com.tvs.model.BatteryPack;
import com.tvs.model.Location;
import com.tvs.model.SwapEvent;
import com.tvs.service.BatteryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/battery")
public class BatteryController {

    @Autowired
    private BatteryService batteryService;

    // Create a new location
    @PostMapping("/locations")
    public ResponseEntity<Location> createLocation(@RequestBody Location location) {
        Location saved = batteryService.createLocation(location);
        return ResponseEntity.ok(saved);
    }

    // Get all locations with battery availability summary
    @GetMapping("/locations")
    public ResponseEntity<List<Map<String, Object>>> getLocationsInventory() {
        List<Map<String, Object>> inventory = batteryService.getLocationsInventory();
        return ResponseEntity.ok(inventory);
    }

    // Create a new battery pack at a location
    @PostMapping("/packs")
    public ResponseEntity<BatteryPack> createBatteryPack(@RequestBody BatteryPack batteryPack, 
                                                        @RequestParam Long locationId) {
        BatteryPack saved = batteryService.createBatteryPack(batteryPack, locationId);
        return ResponseEntity.ok(saved);
    }

    // Get all battery packs optionally filtered by location or status
    @GetMapping("/packs")
    public ResponseEntity<List<BatteryPack>> getBatteryPacks(@RequestParam(required = false) Long locationId, 
                                                             @RequestParam(required = false) String status) {
        List<BatteryPack> batteries = batteryService.getBatteryPacks(locationId, status);
        return ResponseEntity.ok(batteries);
    }

    // Get battery status for a user (latest assigned battery info)
    @GetMapping("/status")
    public ResponseEntity<BatteryPack> getBatteryStatusForUser(@RequestParam String userId) {
        BatteryPack status = batteryService.getBatteryStatusForUser(userId);
        return ResponseEntity.ok(status);
    }

    // Book a battery swap for user at location
    @PostMapping("/swap")
    public ResponseEntity<BatteryPack> bookSwap(@RequestParam String userId, @RequestParam Long locationId) {
        BatteryPack battery = batteryService.bookSwap(userId, locationId);
        return ResponseEntity.ok(battery);
    }

    // Get swap history for a user or battery pack
    @GetMapping("/history")
    public ResponseEntity<List<SwapEvent>> getSwapHistory(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) Long batteryId) {
        List<SwapEvent> history = batteryService.getSwapHistory(userId, batteryId);
        return ResponseEntity.ok(history);
    }

    // Update battery pack info - allow changes to status, health, location, etc.
    @PatchMapping("/packs/{id}")
    public ResponseEntity<BatteryPack> updateBatteryPack(@PathVariable Long id, 
                                                         @RequestBody BatteryPack updated) {
        BatteryPack updatedPack = batteryService.updateBatteryPack(id, updated);
        return ResponseEntity.ok(updatedPack);
    }
}
