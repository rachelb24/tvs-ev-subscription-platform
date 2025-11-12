package com.tvs.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class BatteryPack {

    @Id
    @GeneratedValue
    private Long id;

    @Column(unique = true)
    private String serialNumber;

    @Enumerated(EnumType.STRING)
    private BatteryStatus status;

    private Integer healthPercent;

    @ManyToOne
    private Location location;
}

