package com.tvs.service;

import com.tvs.dto.EmailRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    /** Send simple email without attachment */
    public void sendEmail(EmailRequest request) {
        if (request.getTo() == null || request.getTo().isEmpty()) {
            throw new IllegalArgumentException("Recipient email cannot be null or empty");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(request.getTo());
        message.setSubject(request.getSubject() != null ? request.getSubject() : "No Subject");
        message.setText(request.getBody() != null ? request.getBody() : "");
        mailSender.send(message);
    }

    /** Send email with attachment (like PDF invoice) */
    public void sendEmailWithAttachment(String to, String subject, String body,
                                        MultipartFile attachment, String filename) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);

            if (attachment != null && !attachment.isEmpty()) {
                helper.addAttachment(filename != null ? filename : attachment.getOriginalFilename(),
                        attachment);
            }

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email with attachment", e);
        }
    }
}
