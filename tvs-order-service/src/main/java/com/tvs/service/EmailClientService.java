package com.tvs.service;

import com.tvs.dto.EmailRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.client.MultipartBodyBuilder;

@Service
@RequiredArgsConstructor
public class EmailClientService {

    private final WebClient webClient;

    private static final String EMAIL_SERVICE_URL = "http://localhost:9090/api/notifications/send-email-with-attachment";

    public void sendEmailWithAttachment(EmailRequest emailRequest, byte[] attachmentBytes, String fileName) {
        try {
            MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
            bodyBuilder.part("to", emailRequest.getTo());
            bodyBuilder.part("subject", emailRequest.getSubject());
            bodyBuilder.part("body", emailRequest.getBody());
            bodyBuilder.part("filename", fileName);
            bodyBuilder.part("attachment", new ByteArrayResource(attachmentBytes) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            }).contentType(MediaType.APPLICATION_PDF);

            webClient.post()
                    .uri(EMAIL_SERVICE_URL)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            System.out.println("✅ Email with attachment sent successfully to " + emailRequest.getTo());

        } catch (Exception e) {
            System.err.println("❌ Failed to send email with attachment: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendEmail(EmailRequest emailRequest) {
        try {
            webClient.post()
                    .uri("http://localhost:9090/api/notifications/send-email")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(emailRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {
            System.err.println("❌ Failed to send simple email: " + e.getMessage());
        }
    }
}
