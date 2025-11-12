package com.tvs.scheduler;

import com.tvs.dto.EmailRequest;
import com.tvs.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PlanExpiryScheduler {

    private final EmailService emailService;

    @Scheduled(cron = "0 0 9 * * ?") // Daily 9 AM
    public void sendExpiryReminders() {
        EmailRequest email = new EmailRequest();
        email.setTo("10harshrawat@gmail.com");
        email.setSubject("Your Subscription Will Expire Soon");
        email.setBody("Dear User,\n\nYour subscription will expire in 7 days.\nPlease renew soon to keep enjoying our services.\n\nRegards,\nTVS Motor Team");
        emailService.sendEmail(email);
    }

    @Scheduled(cron = "0 0 9 1 * ?") // 9 AM on 1st of each month
    public void sendPromotionalEmails() {
        List<String> promoEmails = List.of("rachelbennet07@gmail.com");
        promoEmails.forEach(email -> {
            EmailRequest req = new EmailRequest();
            req.setTo(email);
            req.setSubject("Exclusive Offer on Plan 1!");
            req.setBody("Dear Customer,\n\nCheck out our special offer on Plan 1.\nSave big and enjoy premium benefits!\n\nBest,\nTVS Motor Team");
            emailService.sendEmail(req);
        });
    }
}
