package com.tvs.repository;

import com.tvs.entity.PasswordOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PasswordOtpRepository extends JpaRepository<PasswordOtp, UUID> {
    Optional<PasswordOtp> findByEmail(String email);
    void deleteByEmail(String email);
}
