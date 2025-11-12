package com.tvs.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.tvs.dto.EmailRequest;
import com.tvs.dto.UserDto;
import com.tvs.entity.UserPlanOrder;
import com.tvs.repository.UserPlanOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final UserPlanOrderRepository repository;
    private final WebClient webClient;
    private final EmailClientService emailClientService;
    private final PlanClientService planClientService;

    @Value("${userservice.url}")
    private String userServiceUrl;

    @Value("${payment.service.url}")
    private String paymentServiceUrl;

    /** ✅ Verify Razorpay payment status */
    public boolean isPaymentSuccessful(String internalPaymentId) {
        try {
            Map<String, Object> resp = webClient.get()
                    .uri(paymentServiceUrl + "/api/payments/status/internal/{internalPaymentId}", internalPaymentId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            return resp != null && "SUCCESS".equalsIgnoreCase(String.valueOf(resp.get("status")));
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /** ✅ Assign plan to user, save order, generate invoice, and email */
    public UserPlanOrder assignPlan(UUID userId, UUID planId, LocalDate start, LocalDate end,
                                    String razorpayPaymentId, String internalPaymentId) {

        // Create and save order
        UserPlanOrder order = new UserPlanOrder();
        
        order.setUserId(userId);
        order.setPlanId(planId);
        order.setStartDate(start);
        order.setEndDate(end);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order.setIsActive(true);
        order.setPaymentId(razorpayPaymentId);
        order.setPaymentInternalId(internalPaymentId);

        UserPlanOrder savedOrder = repository.save(order);

        // Fetch user, plan, and payment details
        UserDto user = webClient.get()
                .uri(userServiceUrl + "/api/users/{userId}", userId)
                .retrieve()
                .bodyToMono(UserDto.class)
                .block();

        String planName = planClientService.getPlanName(planId);
        Double planPrice = planClientService.getPlanPrice(planId);
        Map<String, Object> paymentDetails = fetchPaymentDetails(internalPaymentId);

        // ✅ Generate invoice PDF
        byte[] pdfBytes = generateInvoicePdf(user, planName, planPrice, savedOrder, paymentDetails);

        // ✅ Send invoice email
        if (user != null && user.getEmail() != null) {
            String subject = "✅ Plan Assigned: " + planName;
            String body = String.format("""
                    Dear %s,

                    Your plan has been successfully assigned!

                    Plan: %s
                    Start Date: %s
                    End Date: %s

                    Please find attached your invoice for this order.

                    Regards,
                    TVS Motor Team
                    """, user.getFullName(), planName, start, end);

            emailClientService.sendEmailWithAttachment(
                    new EmailRequest(user.getEmail(), subject, body),
                    pdfBytes,
                    "invoice_" + savedOrder.getId() + ".pdf"
            );
        }

        return savedOrder;
    }

    private Map<String, Object> fetchPaymentDetails(String internalPaymentId) {
        try {
            return webClient.get()
                    .uri(paymentServiceUrl + "/api/payments/details/{id}", internalPaymentId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of();
        }
    }

    /** ✅ Generate simple invoice PDF using iText */
    private byte[] generateInvoicePdf(UserDto user, String planName, Double planPrice,
                                      UserPlanOrder order, Map<String, Object> payment) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("TVS Subscription Invoice").setFontSize(18).setBold().setMarginBottom(10));
            document.add(new Paragraph("Invoice ID: " + order.getId()));
            document.add(new Paragraph("Date: " +
                    LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"))));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Customer Details").setBold().setFontSize(14));
            document.add(new Paragraph("Name: " + user.getFullName()));
            document.add(new Paragraph("Email: " + user.getEmail()));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Plan Details").setBold().setFontSize(14));
            document.add(new Paragraph("Plan Name: " + planName));
            document.add(new Paragraph("Price: ₹" + planPrice));
            document.add(new Paragraph("Start: " + order.getStartDate()));
            document.add(new Paragraph("End: " + order.getEndDate()));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Payment Details").setBold().setFontSize(14));
            document.add(new Paragraph("Payment ID: " + payment.getOrDefault("razorpayPaymentId", "N/A")));
            document.add(new Paragraph("Internal Payment ID: " + payment.getOrDefault("internalPaymentId", "N/A")));
            document.add(new Paragraph("Amount: ₹" +
                    (Double.parseDouble(payment.getOrDefault("amount", "0").toString()) / 100)));
            document.add(new Paragraph("Status: " + payment.getOrDefault("status", "UNKNOWN")));

            document.add(new Paragraph("\nThank you for choosing TVS!").setFontSize(12));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
    }

    /** ✅ Cancel plan + send cancellation email */
    public void cancelPlan(UUID userId, UUID planId) {
        List<UserPlanOrder> plans = repository.findByUserIdAndIsActiveTrue(userId);
        plans.stream()
                .filter(p -> p.getPlanId().equals(planId))
                .findFirst()
                .ifPresent(plan -> {
                    plan.setIsActive(false);
                    plan.setUpdatedAt(LocalDateTime.now());
                    repository.save(plan);

                    UserDto user = webClient.get()
                            .uri(userServiceUrl + "/api/users/{userId}", userId)
                            .retrieve()
                            .bodyToMono(UserDto.class)
                            .block();

                    String planName = planClientService.getPlanName(planId);
                    if (user != null && user.getEmail() != null) {
                        String subject = "❌ Plan Cancelled: " + (planName != null ? planName : planId);
                        String body = String.format("""
                                Dear %s,

                                Your plan "%s" has been cancelled successfully.
                                Cancellation Date: %s

                                If you did not request this, please contact support.

                                Regards,
                                TVS Team
                                """, user.getFullName(), planName, LocalDate.now());

                        emailClientService.sendEmail(new EmailRequest(user.getEmail(), subject, body));
                    }
                });
    }

    /** ✅ Get active plans for a user */
    public List<UserPlanOrder> getActivePlans(UUID userId) {
        return repository.findByUserIdAndIsActiveTrue(userId);
    }

    /** ✅ Get all orders (for admin) */
    public List<UserPlanOrder> getAllOrders() {
        return repository.findAll();
    }
    public long getActiveOrderCount() {
        return repository.countByIsActiveTrue();
    }

    public long getTotalOrderCount() {
        return repository.count();
    }

    /** ✅ Assign free plan to user (no payment required, no payment details in email/pdf) */
    public UserPlanOrder assignFree(UUID userId, UUID planId, LocalDate start, LocalDate end) {

        // Create and save order
        UserPlanOrder order = new UserPlanOrder();
        order.setUserId(userId);
        order.setPlanId(planId);
        order.setStartDate(start);
        order.setEndDate(end);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order.setIsActive(true);
        // No payment IDs for free plan
        order.setPaymentId(null);
        order.setPaymentInternalId(null);

        UserPlanOrder savedOrder = repository.save(order);

        // Fetch user and plan details
        UserDto user = webClient.get()
                .uri(userServiceUrl + "/api/users/{userId}", userId)
                .retrieve()
                .bodyToMono(UserDto.class)
                .block();

        String planName = planClientService.getPlanName(planId);
        Double planPrice = 0.0; // Free plan

        // Generate invoice PDF without payment section
        byte[] pdfBytes = generateInvoicePdfFree(user, planName, savedOrder);

        // Send email without payment details
        if (user != null && user.getEmail() != null) {
            String subject = "✅ Free Plan Assigned: " + planName;
            String body = String.format("""
                    Dear %s,

                    Your free plan has been successfully assigned!

                    Plan: %s
                    Start Date: %s
                    End Date: %s

                    Please find attached your invoice for this plan.

                    Regards,
                    TVS Motor Team
                    """, user.getFullName(), planName, start, end);

            emailClientService.sendEmailWithAttachment(
                    new EmailRequest(user.getEmail(), subject, body),
                    pdfBytes,
                    "invoice_" + savedOrder.getId() + ".pdf"
            );
        }

        return savedOrder;
    }

    /** ✅ Generate invoice PDF for free plan (no payment info) */
    private byte[] generateInvoicePdfFree(UserDto user, String planName, UserPlanOrder order) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("TVS Subscription Invoice").setFontSize(18).setBold().setMarginBottom(10));
            document.add(new Paragraph("Invoice ID: " + order.getId()));
            document.add(new Paragraph("Date: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"))));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Customer Details").setBold().setFontSize(14));
            document.add(new Paragraph("Name: " + user.getFullName()));
            document.add(new Paragraph("Email: " + user.getEmail()));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Plan Details").setBold().setFontSize(14));
            document.add(new Paragraph("Plan Name: " + planName));
            document.add(new Paragraph("Price: ₹0.0"));
            document.add(new Paragraph("Start: " + order.getStartDate()));
            document.add(new Paragraph("End: " + order.getEndDate()));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Thank you for choosing TVS!").setFontSize(12));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
    }
    

    
}
