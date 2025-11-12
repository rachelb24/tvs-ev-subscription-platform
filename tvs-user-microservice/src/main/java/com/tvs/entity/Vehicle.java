package com.tvs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue
    private UUID vehicleId;

    @Column(nullable = false)
    private String name; // Example: Car, Bike, Scooter

    @Column(nullable = false)
    private Integer modelYear;
}
