package com.tvs.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "features")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Feature {

    @Id
    @GeneratedValue
    private UUID featureId;

    @Column(unique = true, nullable = false, length = 100)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, length = 50)
    private String unit;

    @Column(nullable = false)
    private Integer usageLimit;

    @Column(nullable = false)
    private Double pricePerUnit;

    @Column(nullable = false)
    private Integer defaultIncludedUnits;

    @Column(nullable = false)
    private Boolean isActive;
}
