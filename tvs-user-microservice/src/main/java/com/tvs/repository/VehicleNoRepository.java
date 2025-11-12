package com.tvs.repository;

import com.tvs.entity.VehicleNo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface VehicleNoRepository extends JpaRepository<VehicleNo, UUID> {
    boolean existsByVehicleNo(String vehicleNo);
    Optional<VehicleNo> findByVehicleNo(String vehicleNo);
    @Modifying
    @Query("UPDATE VehicleNo v SET v.used = true WHERE v.vehicleNo = :vehicleNo")
    void markVehicleAsUsed(@Param("vehicleNo") String vehicleNo);
}

