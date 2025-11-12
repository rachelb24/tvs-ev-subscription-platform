package com.tvs.service;

import com.tvs.dto.FeatureRequest;
import com.tvs.dto.FeatureResponse;
import com.tvs.entity.Feature;
import com.tvs.exception.AlreadyExistsException;
import com.tvs.exception.ResourceNotFoundException;
import com.tvs.repository.FeatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeatureService {

    private final FeatureRepository repository;

    public FeatureResponse createFeature(FeatureRequest request) {
        repository.findByCode(request.getCode())
                .ifPresent(f -> { throw new AlreadyExistsException("Feature code already exists"); });

        Feature feature = Feature.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .unit(request.getUnit())
                .usageLimit(request.getUsageLimit())
                .pricePerUnit(request.getPricePerUnit())
                .defaultIncludedUnits(request.getDefaultIncludedUnits())
                .isActive(request.getIsActive())
                .build();

        repository.save(feature);
        return mapToResponse(feature);
    }

    public FeatureResponse getFeature(UUID id) {
        Feature feature = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feature not found"));
        return mapToResponse(feature);
    }

    public List<FeatureResponse> getAllFeatures() {
        return repository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<FeatureResponse> getActiveFeatures() {
        return repository.findByIsActiveTrue()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public FeatureResponse updateFeature(UUID id, FeatureRequest request) {
        Feature feature = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feature not found"));

        if (!feature.getCode().equals(request.getCode())) {
            repository.findByCode(request.getCode())
                    .ifPresent(f -> { throw new AlreadyExistsException("Feature code already exists"); });
            feature.setCode(request.getCode());
        }

        feature.setName(request.getName());
        feature.setDescription(request.getDescription());
        feature.setUnit(request.getUnit());
        feature.setUsageLimit(request.getUsageLimit());
        feature.setPricePerUnit(request.getPricePerUnit());
        feature.setDefaultIncludedUnits(request.getDefaultIncludedUnits());
        feature.setIsActive(request.getIsActive());

        repository.save(feature);
        return mapToResponse(feature);
    }

    public void deleteFeature(UUID id) {
        Feature feature = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feature not found"));
        repository.delete(feature);
    }

    public List<FeatureResponse> searchFeatures(String keyword) {
        return repository.findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(keyword, keyword)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /** ✅ New Method: Count all features */
    public long getFeatureCount() {
        return repository.count();
    }

    private FeatureResponse mapToResponse(Feature feature) {
        return FeatureResponse.builder()
                .featureId(feature.getFeatureId())
                .code(feature.getCode())
                .name(feature.getName())
                .description(feature.getDescription())
                .unit(feature.getUnit())
                .usageLimit(feature.getUsageLimit())
                .pricePerUnit(feature.getPricePerUnit())
                .defaultIncludedUnits(feature.getDefaultIncludedUnits())
                .isActive(feature.getIsActive())
                .build();
    }
}
