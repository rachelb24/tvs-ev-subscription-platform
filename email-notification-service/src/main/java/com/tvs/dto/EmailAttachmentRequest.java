package com.tvs.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class EmailAttachmentRequest {
    private String to;
    private String subject;
    private String body;
    private MultipartFile attachment;
    private String filename;
}
