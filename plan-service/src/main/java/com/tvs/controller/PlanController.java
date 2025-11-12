package com.tvs.controller;

import com.tvs.dto.PlanRequest;
import com.tvs.dto.PlanResponse;
import com.tvs.dto.PricePreviewResponse;
import com.tvs.service.PlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000"
})
@RestController
@RequestMapping("/api/v1/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @PostMapping
    public ResponseEntity<PlanResponse> createPlan(@Valid @RequestBody PlanRequest planRequest) {
        return ResponseEntity.ok(planService.createPlan(planRequest));
    }

    @GetMapping
    public ResponseEntity<List<PlanResponse>> getAllPlans() {
        return ResponseEntity.ok(planService.getAllPlans());
    }

   
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getPlanCount() {
        long count = planService.getPlanCount();
        return ResponseEntity.ok(Collections.singletonMap("count", count));
    }

    @GetMapping("/active")
    public ResponseEntity<List<PlanResponse>> getActivePlans() {
        return ResponseEntity.ok(planService.getActivePlans());
    }

    @GetMapping("/{planId}")
    public ResponseEntity<PlanResponse> getPlan(@PathVariable UUID planId) {
        return ResponseEntity.ok(planService.getPlanById(planId));
    }

    @PutMapping("/{planId}")
    public ResponseEntity<PlanResponse> updatePlan(
            @PathVariable UUID planId,
            @Valid @RequestBody PlanRequest planRequest) {
        return ResponseEntity.ok(planService.updatePlan(planId, planRequest));
    }

    @DeleteMapping("/{planId}")
    public ResponseEntity<Void> deletePlan(@PathVariable UUID planId) {
        planService.deletePlan(planId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{planId}/activate")
    public ResponseEntity<PlanResponse> activatePlan(@PathVariable UUID planId) {
        return ResponseEntity.ok(planService.activatePlan(planId));
    }

    @PostMapping("/{planId}/deactivate")
    public ResponseEntity<PlanResponse> deactivatePlan(@PathVariable UUID planId) {
        return ResponseEntity.ok(planService.deactivatePlan(planId));
    }

    @GetMapping("/preview")
    public ResponseEntity<PricePreviewResponse> previewPrice(@RequestParam List<UUID> featureIds) {
        Double totalPrice = planService.calculatePrice(featureIds);
        return ResponseEntity.ok(new PricePreviewResponse(totalPrice));
    }
    
}
