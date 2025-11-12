package com.tvs.controller;

import com.tvs.dto.PlanResponse;
import com.tvs.dto.UserPlanDto;
import com.tvs.dto.FeatureResponse;
import com.tvs.entity.UserPlanOrder;
import com.tvs.service.OrderService;
import com.tvs.service.PlanClientService;
import com.tvs.config.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor

public class OrderController {

    private final OrderService orderService;
    private final PlanClientService planClientService;
    private final JwtUtil jwtUtil;

    // ✅ Assign plan to a user
    @PostMapping("/{userId}/assign/{planId}")
    public ResponseEntity<?> assignPlan(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID userId,
            @PathVariable UUID planId,
            @RequestParam String razorpayPaymentId,
            @RequestParam(required = false) String internalPaymentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) CharSequence startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        validateUserAccess(authHeader, userId);

        PlanResponse plan = planClientService.getPlan(planId);
        if (plan == null) {
            return ResponseEntity.badRequest().body("Plan not found for ID: " + planId);
        }

        LocalDate start = (startDate != null) ? LocalDate.parse(startDate) : LocalDate.now();
        LocalDate end;
        String duration = (plan.getDuration() != null)
                ? plan.getDuration().trim().toUpperCase()
                : "MONTH";

        switch (duration) {
            case "QUARTER" -> end = start.plusMonths(3);
            case "YEAR" -> end = start.plusYears(1);
            default -> end = start.plusMonths(1);
        }

        if (!planClientService.planExists(planId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Plan does not exist"));
        }

        boolean paid = orderService.isPaymentSuccessful(internalPaymentId);
        if (!paid) {
            return ResponseEntity.status(400).body(Map.of("error", "Payment failed or not verified"));
        }

        UserPlanOrder order = orderService.assignPlan(userId, planId, start, end, razorpayPaymentId, internalPaymentId);
        UserPlanDto dto = mapToDto(order, plan);

        return ResponseEntity.ok(dto);
    }

    // ✅ Cancel user plan
    @PostMapping("/{userId}/cancel/{planId}")
    public ResponseEntity<Void> cancelPlan(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID userId,
            @PathVariable UUID planId) {

        validateUserAccess(authHeader, userId);
        orderService.cancelPlan(userId, planId);
        log.info("Plan {} cancelled for user {}", planId, userId);
        return ResponseEntity.ok().build();
    }

    // ✅ Get all plans for a specific user
    @GetMapping("/{userId}/plans")
    public ResponseEntity<List<UserPlanDto>> getPlans(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID userId) {

        validateUserAccess(authHeader, userId);
        List<UserPlanOrder> orders = orderService.getActivePlans(userId);

        List<UserPlanDto> dtos = orders.stream()
                .map(order -> mapToDto(order, planClientService.getPlan(order.getPlanId())))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // ✅ Admin: Get all orders
    @GetMapping("/all")
    public ResponseEntity<List<UserPlanDto>> getAllOrders(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            List<UserPlanOrder> allOrders = orderService.getAllOrders();

            List<UserPlanDto> dtos = allOrders.stream()
                    .map(order -> mapToDto(order, planClientService.getPlan(order.getPlanId())))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception ex) {
            log.error("Error fetching all orders: {}", ex.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getOrderCount() {
        long totalOrders = orderService.getTotalOrderCount();
        long activeOrders = orderService.getActiveOrderCount();

        return ResponseEntity.ok(Map.of(
                "totalOrders", totalOrders,
                "activeOrders", activeOrders
        ));
    }



    // --- Utility methods ---

    private void validateUserAccess(String authHeader, UUID pathUserId) {
        try {
            String token = authHeader != null && authHeader.startsWith("Bearer ")
                    ? authHeader.substring(7)
                    : authHeader;
            String tokenEmail = jwtUtil.extractEmail(token);

            UUID actualUserId = fetchUserIdByEmail(tokenEmail);

            if (!actualUserId.equals(pathUserId)) {
                throw new RuntimeException("Forbidden: User mismatch");
            }
        } catch (Exception ex) {
            throw new RuntimeException("Unauthorized or missing user info headers");
        }
    }

    private UUID fetchUserIdByEmail(String email) {
        try {
            return WebClient.create()
                    .get()
                    .uri("http://localhost:9003/api/users/by-email/{email}", email)
                    .retrieve()
                    .bodyToMono(UUID.class)
                    .block();
        } catch (Exception ex) {
            log.error("Failed to fetch userId for email {}: {}", email, ex.getMessage());
            throw new RuntimeException("Unable to verify user identity");
        }
    }
    
    private String fetchUserName(UUID userId) {
        try {
            return WebClient.create()
                    .get()
                    .uri("http://localhost:9003/api/users/by-id/{userId}", userId)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception ex) {
            log.error("Failed to fetch name for userId {}: {}", userId, ex.getMessage());
            return null; // caller should handle null
        }
    }

    // --- Update mapToDto to set the userName on the DTO
    private UserPlanDto mapToDto(UserPlanOrder order, PlanResponse plan) {
        UserPlanDto dto = new UserPlanDto();
        dto.setId(order.getId());

        dto.setPlanId(order.getPlanId());
        dto.setUserId(order.getUserId());
        // fetch and set user name
        try {
            String name = fetchUserName(order.getUserId());
            dto.setUserName(name != null ? name : "Unknown User");
        } catch (Exception e) {
            log.warn("Could not fetch userName for {}: {}", order.getUserId(), e.getMessage());
            dto.setUserName("Unknown User");
        }

        dto.setStartDate(order.getStartDate() != null ? order.getStartDate().toString() : null);
        dto.setEndDate(order.getEndDate() != null ? order.getEndDate().toString() : null);
        dto.setIsActive(order.getIsActive());
        dto.setCreatedAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null);

        if (plan != null) {
            dto.setPlanName(plan.getName());
            dto.setDescription(plan.getDescription());
            dto.setDuration(plan.getDuration());
            dto.setTotalPrice(plan.getTotalPrice());
            dto.setDiscountedPrice(plan.getDiscountedPrice());
            dto.setDiscountAmount(plan.getDiscountAmount());
            dto.setIsDiscountActive(plan.getIsDiscountActive());
            dto.setIsPlanActive(plan.getIsActive());
            dto.setFeatures(plan.getFeatures());
        }

        return dto;
    }
 // ✅ Assign free plan to a user (no payment required)
    @PostMapping("/{userId}/assign-free/{planId}")
    public ResponseEntity<?> assignFreePlan(
         
            @PathVariable UUID userId,
            @PathVariable UUID planId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) CharSequence startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

       

        PlanResponse plan = planClientService.getPlan(planId);
        if (plan == null) {
            return ResponseEntity.badRequest().body("Plan not found for ID: " + planId);
        }

        LocalDate start = (startDate != null) ? LocalDate.parse(startDate) : LocalDate.now();
        LocalDate end;
        String duration = (plan.getDuration() != null) ? plan.getDuration().trim().toUpperCase() : "MONTH";

        switch (duration) {
            case "QUARTER" -> end = start.plusMonths(3);
            case "YEAR" -> end = start.plusYears(1);
            default -> end = start.plusMonths(1);
        }

        if (!planClientService.planExists(planId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Plan does not exist"));
        }

        // Call service method for free plan assignment
        UserPlanOrder order = orderService.assignFree(userId, planId, start, end);
        UserPlanDto dto = mapToDto(order, plan);

        return ResponseEntity.ok(dto);
    }

}
