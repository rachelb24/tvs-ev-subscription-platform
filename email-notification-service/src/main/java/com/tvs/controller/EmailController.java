package com.tvs.controller;

import com.tvs.dto.EmailRequest;
import com.tvs.dto.EmailAttachmentRequest;
import com.tvs.dto.PlanEmailRequest;
import com.tvs.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send-email")
    public ResponseEntity<String> sendEmail(@RequestBody EmailRequest request) {
        emailService.sendEmail(request);
        return ResponseEntity.ok("Email sent successfully");
    }

    @PostMapping("/send-email-with-attachment")
    public ResponseEntity<String> sendEmailWithAttachment(@ModelAttribute EmailAttachmentRequest request) {
        emailService.sendEmailWithAttachment(
            request.getTo(),
            request.getSubject(),
            request.getBody(),
            request.getAttachment(),
            request.getFilename()
        );
        return ResponseEntity.ok("Email with attachment sent successfully");
    }

    @PostMapping("/send-plan-created")
    public ResponseEntity<String> sendPlanCreatedEmail(@RequestBody PlanEmailRequest request) {
        String body = String.format(
            "Dear %s,\n\nThank you for subscribing to the %s plan starting on %s.\n" +
            "Enjoy your benefits!\n\nRegards,\nTVS Motor Team",
            request.getUserName(), request.getPlanName(), request.getStartDate()
        );

        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setTo(request.getUserEmail());
        emailRequest.setSubject("Welcome to your new plan!");
        emailRequest.setBody(body);

        emailService.sendEmail(emailRequest);

        return ResponseEntity.ok("Plan created email sent");
    }
}
