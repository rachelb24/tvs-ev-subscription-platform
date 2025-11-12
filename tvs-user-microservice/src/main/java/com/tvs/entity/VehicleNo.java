package com.tvs.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;
@Entity
@Table(name = "vehicle_no")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleNo {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "vehicle_no", nullable = false, unique = true)
    private String vehicleNo;

    @Column(name = "used", nullable = false)
    private boolean used = false;  // default to false
}
