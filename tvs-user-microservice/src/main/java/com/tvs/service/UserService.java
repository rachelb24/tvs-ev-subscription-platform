package com.tvs.service;


import com.tvs.dto.OtpRequest;
import com.tvs.dto.OtpVerifyRequest;
import com.tvs.dto.EmailRequest;
import com.tvs.dto.RegisterRequest;
import com.tvs.dto.UserProfileRequest;
import com.tvs.dto.UserResponse;
import com.tvs.entity.PasswordOtp;
import com.tvs.entity.User;
import com.tvs.entity.Vehicle;
import com.tvs.entity.VehicleNo;
import com.tvs.exception.VehicleNotRegisteredException;
import com.tvs.repository.PasswordOtpRepository;
import com.tvs.repository.UserRepository;
import com.tvs.repository.VehicleNoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final OrderClientService orderClientService;
    private final PasswordOtpRepository otpRepository;
    private final WebClient.Builder webClientBuilder;
    private final VehicleNoRepository vehicleNoRepository;

    private static final long OTP_EXPIRY_MINUTES = 10;

    @Transactional
    public String sendOtpForForgotPassword(OtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String otp = String.format("%06d", new Random().nextInt(999999));

        otpRepository.deleteByEmail(request.getEmail()); // clear old
        PasswordOtp otpEntity = PasswordOtp.builder()
                .email(request.getEmail())
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();

        otpRepository.save(otpEntity);

        // Call email service using WebClient
        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setTo(request.getEmail());
        emailRequest.setSubject("Password Reset OTP");
        emailRequest.setBody("Your OTP for password reset is: " + otp + "\nIt expires in 10 minutes.");

        webClientBuilder.build()
                .post()
                .uri("http://localhost:9090/api/notifications/send-email")
                .bodyValue(emailRequest)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return "OTP sent successfully to " + request.getEmail();
    }

    @Transactional
    public String verifyOtpAndResetPassword(OtpVerifyRequest req) {
        String email = req.getEmail().trim().toLowerCase();

        PasswordOtp otpEntity = otpRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("OTP not found or expired"));

        if (otpEntity.getExpiryTime().isBefore(LocalDateTime.now())) {
            otpRepository.deleteByEmail(email);
            throw new IllegalArgumentException("OTP expired");
        }

        if (!otpEntity.getOtp().equals(req.getOtp())) {
            throw new IllegalArgumentException("Invalid OTP");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        otpRepository.deleteByEmail(email);
        return "Password reset successfully";
    }

    @Transactional
    public UserResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // validate vehicle number provided
        if (req.getVehicleNo() == null || req.getVehicleNo().trim().isEmpty()) {
            throw new IllegalArgumentException("Vehicle number is required");
        }
        String vehicleNoNormalized = req.getVehicleNo().trim().toUpperCase();
        Optional<VehicleNo> vehicleNo = vehicleNoRepository.findByVehicleNo(vehicleNoNormalized);

        if (vehicleNo.isEmpty()) {
            throw new VehicleNotRegisteredException("Vehicle number not registered with RTO");
        }

        // Check if vehicle is already used
        if (vehicleNo.get().isUsed()) {
            throw new IllegalArgumentException("Vehicle number already being used");
        }

        // Mark vehicle as used
        vehicleNoRepository.markVehicleAsUsed(vehicleNoNormalized);

        Vehicle vehicle = null;
        if (req.getVehicleName() != null || req.getVehicleModelYear() != null) {
            vehicle = Vehicle.builder()
                    .name(req.getVehicleName())
                    .modelYear(req.getVehicleModelYear())
                    .build();
        }

        User user = User.builder()
                .fullName(req.getFullName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .mobile(req.getMobile())
                .role("USER")
                .isActive(true)
                .vehicle(vehicle)
                .vehicleNumber(vehicleNoNormalized)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        user = userRepository.save(user);
        return mapToResponse(user, List.of());
    }


    public UUID getUserIdByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        return user.getUserId();
    }
    public String getUserNameById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with userId: " + userId));
        return user.getFullName();
    }

    public UserResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<UserResponse.UserPlanDto> plans = orderClientService.getActivePlans(userId);

        return mapToResponse(user, plans);
    }

    public UserResponse updateProfile(UUID userId, UserProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.getEmail().equals(req.getEmail()) && userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered with another account");
        }

        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setMobile(req.getMobile());
        
        if (req.getIsActive() != null) {
            user.setIsActive(req.getIsActive());
        }

        // If vehicle name/year provided, update vehicle object
        if (req.getVehicleName() != null && req.getVehicleModelYear() != null) {
            Vehicle vehicle = user.getVehicle() != null ? user.getVehicle() : new Vehicle();
            vehicle.setName(req.getVehicleName());
            vehicle.setModelYear(req.getVehicleModelYear());
            user.setVehicle(vehicle);
        }

        // NEW: if vehicleNo provided, validate with vehicle_no table and set it
        if (req.getVehicleNo() != null && !req.getVehicleNo().trim().isEmpty()) {
            String vehicleNoNormalized = req.getVehicleNo().trim().toUpperCase();
            if (!vehicleNoRepository.existsByVehicleNo(vehicleNoNormalized)) {
                throw new IllegalArgumentException("Vehicle number is not registered with RTO");
            }
            user.setVehicleNumber(vehicleNoNormalized);
        }

        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        List<UserResponse.UserPlanDto> plans = orderClientService.getActivePlans(userId);

        return mapToResponse(user, plans);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> {
                    List<UserResponse.UserPlanDto> plans = orderClientService.getActivePlans(user.getUserId());
                    return mapToResponse(user, plans);
                })
                .toList();
    }

    // ✅ Forgot Password - directly reset password (admin/test version, no email OTP)
    public String forgotPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return "Password reset successful for " + email;
    }

    // ✅ Update Password - requires old password validation
    public String updatePassword(UUID userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return "Password updated successfully";
    }

    private UserResponse mapToResponse(User user, List<UserResponse.UserPlanDto> plans) {
        UserResponse resp = new UserResponse();
        resp.setUserId(user.getUserId());
        resp.setFullName(user.getFullName());
        resp.setEmail(user.getEmail());
        resp.setMobile(user.getMobile());
        resp.setIsActive(user.getIsActive());
        resp.setPlans(plans);

        if (user.getVehicle() != null) {
            resp.setVehicleName(user.getVehicle().getName());
            resp.setVehicleModelYear(user.getVehicle().getModelYear());
        }

        // NEW: vehicle number
        resp.setVehicleNumber(user.getVehicleNumber());

        return resp;
    }

    // ✅ ADD THESE METHODS FOR DASHBOARD COUNTS
    public long getTotalUserCount() {
        return userRepository.count();
    }

    public long getActiveUserCount() {
        return userRepository.countByIsActiveTrue();
    }

    public long getInactiveUserCount() {
        return userRepository.countByIsActiveFalse();
    }
}
