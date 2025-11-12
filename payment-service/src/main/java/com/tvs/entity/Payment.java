package com.tvs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

	@Id

	@Column(name = "id", updatable = false, nullable = false)
	private UUID id;


    // Razorpay ids
    @Column(name = "razorpay_order_id", unique = true)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", unique = true)
    private String razorpayPaymentId;

    @Column(name = "amount")
    private Long amount; // stored in paise

    @Column(name = "currency")
    private String currency;

    @Column(name = "status")
    private String status; // CREATED, SUCCESS, FAILED

    @Column(name = "user_id")
    private String userId; // store gateway forwarded user id (UUID as string)

    @Column(name = "email")
    private String email;

    @Column(name = "receipt")
    private String receipt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
