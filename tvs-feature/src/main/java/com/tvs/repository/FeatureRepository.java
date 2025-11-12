package com.tvs.repository;

import com.tvs.entity.Feature;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FeatureRepository extends JpaRepository<Feature, UUID> {
    Optional<Feature> findByCode(String code);
    List<Feature> findByIsActiveTrue();
    List<Feature> findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(String name, String code);
}
