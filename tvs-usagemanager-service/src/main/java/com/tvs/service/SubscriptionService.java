package com.tvs.service;
import com.tvs.dto.UserDto;
import com.tvs.entity.UserSubscription;
import com.tvs.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
@Service
@RequiredArgsConstructor
public class SubscriptionService {
    private final UserSubscriptionRepository repository;
    private final PlanClientService planClientService;
    private final WebClient webClient;
    // -----------------------------------------------------------------------
    // ASSIGN NORMAL SUBSCRIPTION
    // -----------------------------------------------------------------------
    @Transactional
    public UserSubscription assignSubscription(UUID userId, UUID planId, LocalDate start, LocalDate end) {
        if (!planClientService.planExists(planId)) {
            throw new IllegalArgumentException("Plan does not exist");
        }
        boolean exists = repository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .anyMatch(s -> s.getPlanId().equals(planId));
        if (exists) {
            throw new IllegalArgumentException("User already has an active subscription with this plan");
        }
        UserSubscription subscription = UserSubscription.builder()
                .userId(userId)
                .planId(planId)
                .startDate(start)
                .endDate(end)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return repository.save(subscription);
    }
    // -----------------------------------------------------------------------
    // CANCEL SUBSCRIPTION
    // -----------------------------------------------------------------------
    public void cancelSubscription(UUID userId, UUID planId) {
        List<UserSubscription> activeSubs = repository.findByUserIdAndIsActiveTrue(userId);
        activeSubs.stream()
                .filter(s -> s.getPlanId().equals(planId))
                .forEach(s -> {
                    s.setIsActive(false);
                    s.setUpdatedAt(LocalDateTime.now());
                    repository.save(s);
                });
    }
    // -----------------------------------------------------------------------
    // AUTO RENEW EXPIRED SUBSCRIPTIONS DAILY
    // -----------------------------------------------------------------------
    @Scheduled(cron = "0 0 0 * * ?")
    public void autoRenewSubscriptions() {
        LocalDate today = LocalDate.now();
        List<UserSubscription> expiredSubs = repository.findByEndDateBeforeAndIsActiveTrue(today);
        for (UserSubscription sub : expiredSubs) {
            sub.setIsActive(false);
            sub.setUpdatedAt(LocalDateTime.now());
            repository.save(sub);
            UserSubscription renewed = UserSubscription.builder()
                    .userId(sub.getUserId())
                    .planId(sub.getPlanId())
                    .startDate(today)
                    .endDate(today.plusMonths(12))
                    .isActive(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            repository.save(renewed);
            UserDto user = webClient.get()
                    .uri("http://localhost:9003/api/users/{userId}", sub.getUserId())
                    .retrieve()
                    .bodyToMono(UserDto.class)
                    .block();
            if (user != null && user.getEmail() != null) {
                Map<String, String> emailRequest = Map.of(
                        "to", user.getEmail(),
                        "subject", "Your Subscription Has Been Renewed",
                        "body", "Dear " + user.getFullName() + ",\n\n" +
                                "Your subscription has been renewed.\n" +
                                "Plan ID: " + sub.getPlanId() +
                                "\nStart Date: " + today +
                                "\nEnd Date: " + today.plusMonths(12) +
                                "\n\nRegards,\nTVS Motor Team"
                );
                webClient.post()
                        .uri("http://localhost:9090/api/notifications/send-email")
                        .bodyValue(emailRequest)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
            }
        }
    }
    // -----------------------------------------------------------------------
    // ASSIGN FREE SUBSCRIPTION
    // -----------------------------------------------------------------------
    @Transactional
    public UserSubscription assignFreeSubscription(UUID userId, UUID planId, LocalDate start, LocalDate end) {
        if (!planClientService.planExists(planId)) {
            throw new IllegalArgumentException("Plan does not exist");
        }
        boolean exists = repository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .anyMatch(s -> s.getPlanId().equals(planId));
        if (exists) {
            throw new IllegalArgumentException("User already has an active subscription with this plan");
        }
        UserSubscription subscription = UserSubscription.builder()
                .userId(userId)
                .planId(planId)
                .startDate(start)
                .endDate(end)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return repository.save(subscription);
    }
    // -----------------------------------------------------------------------
    // GET ACTIVE SUBSCRIPTIONS
    // -----------------------------------------------------------------------
    public List<UserSubscription> getActiveSubscriptions(UUID userId) {
        LocalDate today = LocalDate.now();
        // Mark expired subscriptions as inactive
        List<UserSubscription> expiredSubs = repository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .filter(s -> s.getEndDate().isBefore(today))
                .toList();
        for (UserSubscription sub : expiredSubs) {
            sub.setIsActive(false);
            sub.setUpdatedAt(LocalDateTime.now());
            repository.save(sub);
        }
        // Return still-active subscriptions (sorted by latest createdAt)
        return repository.findByUserIdAndIsActiveTrueAndEndDateAfterOrderByCreatedAtDescUpdatedAtDesc(userId, today);
    }
}