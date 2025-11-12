package com.tvs.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.HexFormat;

public class RazorpaySignatureUtil {

    // Razorpay signs payload = orderId|paymentId using HMAC_SHA256(secret)
    public static boolean verifyPaymentSignature(String orderId, String paymentId, String providedSignature, String secret) {
        try {
            String payload = orderId + "|" + paymentId;

            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(secret.getBytes("UTF-8"), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(payload.getBytes("UTF-8"));

            // Convert to lowercase hex
            String generatedSignature = HexFormat.of().formatHex(hash);
            return generatedSignature.equalsIgnoreCase(providedSignature);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
