package com.tvs.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PasswordRequest {

    // For forgot password
    @Email
    private String email;

    // For update password
    private String oldPassword;

    @NotBlank
    private String newPassword;
}
