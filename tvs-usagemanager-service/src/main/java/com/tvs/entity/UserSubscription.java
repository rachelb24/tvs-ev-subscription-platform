package com.tvs.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity
@Table(name = "user_subscriptions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UserSubscription {
    @Id
    @GeneratedValue
    private UUID id;
    @Column(nullable = false)
    private UUID userId;
    @Column(nullable = false)
    private UUID planId;
    @Column(nullable = false)
    private LocalDate startDate;
    @Column(nullable = false)
    private LocalDate endDate;
    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;
    @Column(nullable = false)
    private LocalDateTime createdAt;
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}