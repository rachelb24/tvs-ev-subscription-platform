package com.tvs.controller;

import com.tvs.entity.Payment;
import com.tvs.service.PaymentService;
import com.tvs.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final JwtUtil jwtUtil; // ✅ To extract email from JWT
    private final RestTemplate restTemplate = new RestTemplate(); // ✅ To contact User Service

    /**
     * ✅ Create Razorpay order for logged-in user using JWT
     */
    @PostMapping("/create")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> requestData,
                                         HttpServletRequest request) {
        try {
            // ✅ Step 1: Get Authorization header
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Missing Authorization header"));
            }

            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);
            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid token — email not found"));
            }

            // ✅ Step 2: Get userId from User Service
            ResponseEntity<String> userResp =
                    restTemplate.getForEntity("http://localhost:9003/api/users/by-email/" + email, String.class);
            String userId = userResp.getBody();

            if (userId == null || userId.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found for email: " + email));
            }

            // ✅ Step 3: Extract planId from request
            if (!requestData.containsKey("planId")) {
                return ResponseEntity.badRequest().body(Map.of("error", "planId is required"));
            }

            String planId = requestData.get("planId").toString();

            // ✅ Step 4: Fetch price from Plan Service through Gateway with Authorization header
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authHeader); // Forward JWT to Plan Service
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map<String, Object>> planResp = restTemplate.exchange(
                    "http://localhost:8083/api/v1/plans/" + planId, // Gateway route
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<>() {}
            );

            Map<String, Object> planData = planResp.getBody();
            double amountDouble = 0.0;

            if (planData != null) {
                if (Boolean.TRUE.equals(planData.get("isDiscountActive")) && planData.get("discountedPrice") != null) {
                    amountDouble = Double.parseDouble(planData.get("discountedPrice").toString());
                } else if (planData.get("totalPrice") != null) {
                    amountDouble = Double.parseDouble(planData.get("totalPrice").toString());
                }
            }

            if (amountDouble <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid plan price"));
            }

            long amountPaise = (long) (amountDouble * 100);
            String currency = "INR";
            String receipt = "receipt_" + System.currentTimeMillis();

            // ✅ Step 5: Create Razorpay order using fetched price
            Map<String, Object> resp = paymentService.createRazorpayOrder(amountPaise, currency, receipt, userId, email);
            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Payment order creation failed",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * ✅ Verify Razorpay payment and save result
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> payload) {
        try {
            String razorpayOrderId = payload.get("razorpay_order_id");
            String razorpayPaymentId = payload.get("razorpay_payment_id");
            String razorpaySignature = payload.get("razorpay_signature");

            if (razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing required parameters"));
            }

            Optional<Payment> opt = paymentService.verifyAndSavePayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
            if (opt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Order not found for provided razorpay_order_id"));
            }

            Payment payment = opt.get();
            return ResponseEntity.ok(Map.of(
                    "internalPaymentId", payment.getId().toString(),
                    "razorpayPaymentId", payment.getRazorpayPaymentId(),
                    "status", payment.getStatus(),
                    "eligibleForPlanAssignment", "SUCCESS".equalsIgnoreCase(payment.getStatus())
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Verification failed",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * ✅ Get payment details by internalPaymentId
     */
    @GetMapping("/details/{internalPaymentId}")
    public ResponseEntity<?> getPaymentDetails(@PathVariable String internalPaymentId) {
        return paymentService.getByInternalId(internalPaymentId)
                .map(payment -> ResponseEntity.ok(Map.of(
                        "internalPaymentId", payment.getId().toString(),
                        "razorpayPaymentId", payment.getRazorpayPaymentId(),
                        "status", payment.getStatus(),
                        "userId", payment.getUserId(),
                        "email", payment.getEmail(),
                        "amount", payment.getAmount()
                )))
                .orElse(ResponseEntity.status(404).body(Map.of("error", "Payment not found")));
    }

    /**
     * ✅ Small endpoint for other services (like OrderService) to check payment status by razorpayPaymentId
     */
    @GetMapping("/status/{razorpayPaymentId}")
    public ResponseEntity<?> paymentStatus(@PathVariable String razorpayPaymentId) {
        String status = paymentService.getStatusByRazorpayPaymentId(razorpayPaymentId);
        return ResponseEntity.ok(Map.of(
                "razorpayPaymentId", razorpayPaymentId,
                "status", status
        ));
    }

    /**
     * ✅ Get payment status by internalPaymentId
     */
    @GetMapping("/status/internal/{internalPaymentId}")
    public ResponseEntity<?> paymentStatusByInternal(@PathVariable String internalPaymentId) {
        String status = paymentService.getStatusByInternalPaymentId(internalPaymentId);
        return ResponseEntity.ok(Map.of(
                "internalPaymentId", internalPaymentId,
                "status", status
        ));
    }

    /**
     * ✅ Fetch payment details by internalPaymentId
     */
    @GetMapping("/{internalPaymentId}")
    public ResponseEntity<?> getByInternalId(@PathVariable String internalPaymentId) {
        return paymentService.getByInternalId(internalPaymentId)
                .map(p -> ResponseEntity.ok(Map.of(
                        "internalPaymentId", p.getId().toString(),
                        "razorpayOrderId", p.getRazorpayOrderId(),
                        "razorpayPaymentId", p.getRazorpayPaymentId(),
                        "status", p.getStatus(),
                        "amount", p.getAmount()
                )))
                .orElse(ResponseEntity.status(404).body(Map.of("error", "Payment not found")));
    }
}
