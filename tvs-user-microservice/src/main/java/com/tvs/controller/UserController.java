package com.tvs.controller;

import com.tvs.dto.UserProfileRequest;
import com.tvs.dto.UserResponse;
import com.tvs.service.UserService;
import com.tvs.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor

public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    // ✅ Get own profile using JWT
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getMyProfile(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);
        UUID userId = userService.getUserIdByEmail(email);
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    // ✅ Update own profile using JWT
    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody UserProfileRequest req) {

        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);
        UUID userId = userService.getUserIdByEmail(email);

        return ResponseEntity.ok(userService.updateProfile(userId, req));
    }

    // ✅ Get any user by ID (optional: restrict to ADMIN)
    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    // ✅ NEW: Get all users (Admin only)
    @GetMapping("/all")
    public ResponseEntity<List<UserResponse>> getAllUsers(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        List<String> roles = jwtUtil.extractRoles(token);

        if (!roles.contains("ADMIN")) {
            return ResponseEntity.status(403).build(); // Forbidden if not admin
        }

        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/by-email/{email}")
    public ResponseEntity<UUID> getUserIdByEmail(@PathVariable String email) {
        UUID userId = userService.getUserIdByEmail(email);
        return ResponseEntity.ok(userId);
    }
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUserCount(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        long totalUsers = userService.getTotalUserCount();
        long activeUsers = userService.getActiveUserCount();
        long inactiveUsers = userService.getInactiveUserCount();

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "activeUsers", activeUsers,
                "inactiveUsers", inactiveUsers
        ));
    }

    @GetMapping("/by-id/{userId}")
    public ResponseEntity<String> getUserNameById(@PathVariable UUID userId) {
        String fullName= userService.getUserNameById(userId);
        return ResponseEntity.ok(fullName);
    }
    
    @PutMapping("/{userId}")
    public ResponseEntity<UserResponse> updateUserById(
            @PathVariable UUID userId,
            @RequestBody UserProfileRequest req) {
        return ResponseEntity.ok(userService.updateProfile(userId, req));
    }




}
