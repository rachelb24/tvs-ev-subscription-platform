package com.tvs.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    // ⚠️ Must exactly match the secret key used to sign tokens in your gateway or auth-service
    private static final String SECRET_KEY = "MySuperSecureJwtSecretKeyForProduction1234567890";

    private final SecretKey key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());

    /**
     * Extracts email (subject) from JWT token
     */
    public String extractEmail(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return claims.getSubject(); // typically email
        } catch (SignatureException e) {
            System.out.println("Invalid JWT signature: " + e.getMessage());
            return null;
        } catch (Exception e) {
            System.out.println("JWT parsing error: " + e.getMessage());
            return null;
        }
    }

    /**
     * Extracts any custom claim (e.g. role)
     */
    public Object extractClaim(String token, String claimKey) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return claims.get(claimKey);
        } catch (Exception e) {
            return null;
        }
    }
}
