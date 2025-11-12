package com.tvs.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class Location {
    @Id
    @GeneratedValue
    private Long id;

    private String name;
    private String address;
    private int coordinateX; // dummy coordinate
    private int coordinateY;
}
