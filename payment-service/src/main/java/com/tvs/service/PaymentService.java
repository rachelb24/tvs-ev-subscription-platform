package com.tvs.service;

import com.tvs.entity.Payment;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.tvs.repository.PaymentRepository;
import com.tvs.util.RazorpaySignatureUtil;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final PaymentRepository paymentRepository;

    @Value("${razorpay.key.secret}")
    private String razorpaySecret;

    // ✅ Create real Razorpay order
    public Map<String, Object> createRazorpayOrder(long amountPaise, String currency, String receipt, String userId, String email) throws Exception {
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountPaise);
        orderRequest.put("currency", currency);
        orderRequest.put("receipt", receipt);
        orderRequest.put("payment_capture", 1);

        Order order = razorpayClient.orders.create(orderRequest);
        String razorpayOrderId = order.get("id");

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .razorpayOrderId(razorpayOrderId)
                .amount(amountPaise)
                .currency(currency)
                .status("CREATED")
                .userId(userId)
                .email(email)
                .receipt(receipt)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        return Map.of(
                "razorpayOrderId", razorpayOrderId,
                "amount", amountPaise,
                "currency", currency,
                "receipt", receipt,
                "internalPaymentId", payment.getId().toString()
        );
    }

    // ✅ Verify payment signature + confirm with Razorpay API
    public Optional<Payment> verifyAndSavePayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        Optional<Payment> opt = paymentRepository.findByRazorpayOrderId(razorpayOrderId);
        if (opt.isEmpty()) return Optional.empty();

        Payment payment = opt.get();

        boolean isSignatureValid = RazorpaySignatureUtil.verifyPaymentSignature(
                razorpayOrderId, razorpayPaymentId, razorpaySignature, razorpaySecret
        );

        if (!isSignatureValid) {
            payment.setStatus("FAILED");
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.saveAndFlush(payment);
            return Optional.of(payment);
        }

        try {
            // ✅ Fully qualify Razorpay class to avoid conflict
            com.razorpay.Payment razorPayment = razorpayClient.payments.fetch(razorpayPaymentId);
            String status = razorPayment.get("status");

            payment.setRazorpayPaymentId(razorpayPaymentId);
            payment.setUpdatedAt(LocalDateTime.now());

            if ("captured".equalsIgnoreCase(status)) {
                payment.setStatus("SUCCESS");
            } else {
                payment.setStatus(status.toUpperCase());
            }

            paymentRepository.saveAndFlush(payment);
        } catch (Exception e) {
            e.printStackTrace();
            payment.setStatus("FAILED");
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.saveAndFlush(payment);
        }

        return Optional.of(payment);
    }

    public Optional<Payment> getByInternalId(String internalId) {
        try {
            return paymentRepository.findById(UUID.fromString(internalId));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    public String getStatusByRazorpayPaymentId(String razorpayPaymentId) {
        return paymentRepository.findByRazorpayPaymentId(razorpayPaymentId)
                .map(Payment::getStatus)
                .orElse("NOT_FOUND");
    }

    public String getStatusByInternalPaymentId(String internalPaymentId) {
        return getByInternalId(internalPaymentId)
                .map(Payment::getStatus)
                .orElse("NOT_FOUND");
    }
}
