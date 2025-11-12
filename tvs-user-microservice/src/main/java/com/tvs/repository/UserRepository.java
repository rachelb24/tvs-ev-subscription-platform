package com.tvs.repository;

import com.tvs.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findById(UUID userId);
    boolean existsByEmail(String email);
    
    // ✅ Add count queries
    long countByIsActiveTrue();   // Active users
    long countByIsActiveFalse();  // Inactive users
}
