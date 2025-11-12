package com.tvs.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
public class SwapEvent {

    @Id
    @GeneratedValue
    private Long id;

    private String userId;

    @ManyToOne
    private BatteryPack batteryPack;

    @ManyToOne
    private Location fromLocation;

    @ManyToOne
    private Location toLocation;

    private LocalDateTime swapTime;

    @Enumerated(EnumType.STRING)
    private SwapAction action;
}
