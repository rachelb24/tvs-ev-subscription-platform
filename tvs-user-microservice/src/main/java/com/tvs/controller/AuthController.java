package com.tvs.controller;
import java.util.UUID;
import com.tvs.dto.AuthResponse;
import com.tvs.dto.LoginRequest;
import com.tvs.dto.OtpRequest;
import com.tvs.dto.OtpVerifyRequest;
import com.tvs.dto.RegisterRequest;
import com.tvs.dto.UserResponse;
import com.tvs.service.AuthService;
import com.tvs.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.tvs.dto.PasswordRequest;
@RestController

@RequestMapping("/api/users")
@RequiredArgsConstructor

public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(userService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody PasswordRequest req) {
        return ResponseEntity.ok(userService.forgotPassword(req.getEmail(), req.getNewPassword()));
    }
    @PostMapping("/forgot-password/request")
    public ResponseEntity<String> sendOtp(@Valid @RequestBody OtpRequest request) {
        return ResponseEntity.ok(userService.sendOtpForForgotPassword(request));
    }

    @PostMapping("/forgot-password/verify")
    public ResponseEntity<String> verifyOtpAndReset(@Valid @RequestBody OtpVerifyRequest request) {
        return ResponseEntity.ok(userService.verifyOtpAndResetPassword(request));
    }



    @PutMapping("/update-password")
    public ResponseEntity<String> updatePassword(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody PasswordRequest req) {

        String token = authHeader.replace("Bearer ", "");
        String email = authService.getEmailFromToken(token);
        UUID userId = userService.getUserIdByEmail(email);

        return ResponseEntity.ok(userService.updatePassword(userId, req.getOldPassword(), req.getNewPassword()));
    }

    
}
