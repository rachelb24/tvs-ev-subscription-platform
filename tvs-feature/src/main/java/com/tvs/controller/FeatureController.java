package com.tvs.controller;

import com.tvs.dto.FeatureRequest;
import com.tvs.dto.FeatureResponse;
import com.tvs.service.FeatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.*;


@RestController
@RequestMapping("/api/v1/features")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class FeatureController {

    private final FeatureService service;

    @PostMapping
    public ResponseEntity<FeatureResponse> createFeature(@Valid @RequestBody FeatureRequest request) {
        return ResponseEntity.ok(service.createFeature(request));
    }

    @GetMapping
    public ResponseEntity<List<FeatureResponse>> getAllFeatures() {
        return ResponseEntity.ok(service.getAllFeatures());
    }

    @GetMapping("/active")
    public ResponseEntity<List<FeatureResponse>> getActiveFeatures() {
        return ResponseEntity.ok(service.getActiveFeatures());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeatureResponse> getFeature(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getFeature(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FeatureResponse> updateFeature(@PathVariable UUID id, @Valid @RequestBody FeatureRequest request) {
        return ResponseEntity.ok(service.updateFeature(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeature(@PathVariable UUID id) {
        service.deleteFeature(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<FeatureResponse>> searchFeatures(@RequestParam("q") String keyword) {
        return ResponseEntity.ok(service.searchFeatures(keyword));
    }

    /** New endpoint: Count all features  ---*/
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getFeatureCount() {
        long count = service.getFeatureCount();
        return ResponseEntity.ok(Collections.singletonMap("count", count));
    }
}



