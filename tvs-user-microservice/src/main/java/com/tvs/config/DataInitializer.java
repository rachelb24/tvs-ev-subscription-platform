package com.tvs.config;

import com.tvs.entity.VehicleNo;
import com.tvs.repository.VehicleNoRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final VehicleNoRepository vehicleNoRepository;

    // Remove or modify these seeds as you wish.
    @PostConstruct
    public void seedVehicleNumbers() {
        if (vehicleNoRepository.count() == 0) {
            List<VehicleNo> seeds = List.of(
            		 VehicleNo.builder().vehicleNo("KA01AB1234").build(),
                     VehicleNo.builder().vehicleNo("KA02CD5678").build(),
                     VehicleNo.builder().vehicleNo("KA03EF9012").build(),
                     VehicleNo.builder().vehicleNo("KA04GH3456").build(),
                     VehicleNo.builder().vehicleNo("KA05JK7890").build(),
                     VehicleNo.builder().vehicleNo("KA06LM1122").build(),
                     VehicleNo.builder().vehicleNo("KA07NP3344").build(),
                     VehicleNo.builder().vehicleNo("KA08QR5566").build(),
                     VehicleNo.builder().vehicleNo("KA09ST7788").build(),
                     VehicleNo.builder().vehicleNo("KA10UV9900").build(),

                     // Tamil Nadu vehicles
                     VehicleNo.builder().vehicleNo("TN01AA1111").build(),
                     VehicleNo.builder().vehicleNo("TN02BB2222").build(),
                     VehicleNo.builder().vehicleNo("TN10EF0001").build()
            );
            vehicleNoRepository.saveAll(seeds);
        }
    }
}
