# 📊 TVS Plan Usage & Subscription Service

A Spring Boot microservice that manages **user subscriptions**, **plan usage**, **feature consumption**, and **feature usage history**. Integrates with the TVS User Service and Plan Service to initialize feature quotas for subscriptions and to enforce/track usage of plan features.

---

## 🧩 Key Features

* Initialize usage quotas for a subscription based on plan features.
* Consume feature units (transactional) and record usage history.
* Retrieve usage summary and detailed feature usage history.
* Assign / cancel subscriptions (and auto-initialize usage).
* JWT-based ownership validation (via `JwtUtils` + user-service lookup).
* Uses `WebClient` to fetch plan metadata (features + default included units).

---

## 🏗️ Tech Stack

| Layer       | Technology                  |
| ----------- | --------------------------- |
| Framework   | Spring Boot 3.x             |
| HTTP Client | Spring WebFlux `WebClient`  |
| Persistence | Spring Data JPA (Hibernate) |
| Language    | Java 17+                    |
| Build       | Maven                       |
| Utilities   | Lombok                      |

---

## 📁 Folder Structure (overview)

```
src/main/java/com/tvs
│
├── controller/
│   ├── PlanUsageController.java       // endpoints: initialize, consume, get usage & history
│   └── SubscriptionController.java    // assign/cancel subscriptions, list user subscriptions
│
├── service/
│   ├── PlanUsageService.java          // core business: initialize, consume, history
│   ├── SubscriptionService.java      // subscription assign/cancel logic
│   └── PlanClientService.java        // talk to Plan microservice
│
├── entity/
│   ├── PlanUsage.java                // plan_usage table
│   ├── FeatureUsageHistory.java      // feature_usage_history table
│   └── UserSubscription.java         // user_subscriptions table
│
├── repository/
│   ├── PlanUsageRepository.java
│   ├── FeatureUsageHistoryRepository.java
│   └── UserSubscriptionRepository.java
│
├── dto/                              // DTOs (UserPlanDto, PlanResponse, etc.)
└── util/
    └── JwtUtils.java                 // extract email from token and helper methods
```

---

## ⚙️ Setup Instructions

### ✅ Prerequisites

* Java 17+
* Maven 3.8+
* MySQL / PostgreSQL (or other JPA-compatible DB)
* Running Plan microservice (for plan features)
* Running User microservice (for by-email → userId lookup)

### 🚀 Run locally

```bash
git clone https://github.com/yourusername/tvs-plan-usage-service.git
cd tvs-plan-usage-service

# configure application.properties
mvn clean package
mvn spring-boot:run
```

Or run the jar:

```bash
java -jar target/tvs-plan-usage-service-0.0.1-SNAPSHOT.jar
```

---

## ⚙️ Example `application.properties`

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/tvs_plan_usage_db
spring.datasource.username=root
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update

# Server
server.port=9006

# External services
plan.service.url=http://localhost:9002/api/v1/plans   # plan lookup
userservice.url=http://localhost:9003                 # user by-email lookup

# Optional: WebClient timeouts (if configured)
```

---

## 📘 REST API (representative)

**Base path:** `/api/plan-usage` and `/api/subscriptions`

### POST `/api/plan-usage/initialize/{subscriptionId}/{planId}`

Initialize usage entries for every feature in the plan for a given subscription.

**Path params**

* `subscriptionId` (UUID)
* `planId` (UUID)

**Success (200)**: returns `List<PlanUsage>` created for the subscription.

**Example**

```bash
curl -X POST "http://localhost:9006/api/plan-usage/initialize/SUB_UUID/PLAN_UUID"
```

---

### GET `/api/plan-usage/{subscriptionId}`

Get current usage entries for a subscription (initializes if empty).

**Headers**

* `Authorization: Bearer <token>`

**Success (200)**: returns `List<PlanUsage>`

**Example**

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:9006/api/plan-usage/SUB_UUID"
```

---

### GET `/api/plan-usage/{subscriptionId}/feature/{featureName}/history`

Get usage history for a given feature on a subscription.

**Headers**

* `Authorization: Bearer <token>`

**Example**

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:9006/api/plan-usage/SUB_UUID/feature/myFeature/history"
```

---

### POST `/api/plan-usage/consume`

Consume 1 unit (default) or specified units for a feature.

**Headers**

* `Authorization: Bearer <token>`

**Body (either subscriptionId OR userId):**

```json
{
  "subscriptionId": "SUB_UUID",
  "featureName": "myFeature"
}
```

or

```json
{
  "userId": "USER_UUID",
  "featureName": "myFeature"
}
```

**Notes**

* If `userId` provided, the service finds the active subscription and consumes from it.
* Returns 200 with `{ "message": "Feature 'X' consumed successfully." }` or 400 if insufficient credits.

**Example**

```bash
curl -X POST "http://localhost:9006/api/plan-usage/consume" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"subscriptionId":"SUB_UUID","featureName":"myFeature"}'
```

---

### Subscription endpoints

#### POST `/api/subscriptions/{userId}/assign/{planId}`

Assign a subscription (calculates start/end from plan duration and initializes usage).

**Headers**

* `Authorization: Bearer <token>`

**Example**

```bash
curl -X POST "http://localhost:9006/api/subscriptions/USER_UUID/assign/PLAN_UUID?startDate=2025-11-01" \
  -H "Authorization: Bearer <token>"
```

#### DELETE `/api/subscriptions/{userId}/cancel/{planId}`

Cancel a user's subscription.

**Headers**

* `Authorization: Bearer <token>`

#### GET `/api/subscriptions/{userId}`

Get all active subscriptions for a user.

---

## 🗄️ Database Entities (summary & sample DDL)

### `user_subscriptions`

* `id` UUID PK
* `user_id` UUID
* `plan_id` UUID
* `start_date` DATE
* `end_date` DATE
* `is_active` BOOLEAN
* `created_at` DATE
* `updated_at` DATE

### `plan_usage`

* `id` UUID PK
* `subscription_id` UUID
* `feature_id` UUID
* `feature_name` VARCHAR
* `total_units` INT
* `used_units` INT

### `feature_usage_history`

* `id` UUID PK
* `subscription_id` UUID
* `feature_id` UUID
* `feature_name` VARCHAR
* `units_used` INT
* `used_at` DATETIME

**Sample MySQL DDL**

```sql
CREATE TABLE user_subscriptions (
  id BINARY(16) NOT NULL PRIMARY KEY,
  user_id BINARY(16) NOT NULL,
  plan_id BINARY(16) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATE NOT NULL,
  updated_at DATE NOT NULL
);

CREATE TABLE plan_usage (
  id BINARY(16) NOT NULL PRIMARY KEY,
  subscription_id BINARY(16) NOT NULL,
  feature_id BINARY(16) NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  total_units INT NOT NULL,
  used_units INT NOT NULL DEFAULT 0,
  UNIQUE (subscription_id, feature_id)
);

CREATE TABLE feature_usage_history (
  id BINARY(16) NOT NULL PRIMARY KEY,
  subscription_id BINARY(16) NOT NULL,
  feature_id BINARY(16) NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  units_used INT NOT NULL,
  used_at DATETIME NOT NULL
);
```

> Adjust UUID column storage (`BINARY(16)` vs `CHAR(36)`) to match your project conventions.

---

## ✅ Important Implementation Notes

* **Plan metadata:** `PlanUsageService.initializeUsage` expects the Plan service to return a JSON containing a `features` array where each feature includes `featureId`, `name`, and `defaultIncludedUnits`.
* **JWT validation:** `JwtUtils.extractEmail(authHeader)` should accept either a raw token or `Bearer <token>` header and return the email used to fetch userId from User Service.
* **User lookup:** Controllers call `GET /api/users/by-email/{email}` on the User Service and expect a UUID body.
* **Transactional consumption:** `consumeUnits` is `@Transactional` to avoid race conditions when multiple requests try to consume the same quota.
* **Blocking WebClient:** `.block()` is used for simplicity; consider reactive flows or async solutions for scale.

---

## 🧾 Error Handling & Troubleshooting

* **`Plan not found` / `Invalid features`** → verify `plan.service.url` and the plan response schema.
* **`Unable to fetch userId` / `Unauthorized`** → ensure User service is reachable and JWT utils extract a valid email.
* **`Insufficient credits`** → check `totalUnits` for the feature in `plan_usage`.
* **Concurrency issues** → ensure DB isolation or optimistic locking if heavy concurrent consumption is expected.

---

## 🔒 Security Recommendations

* Use Spring Security to enforce role-based access and validate JWTs at filter level.
* Never trust external responses — validate feature structures and numeric values before persisting.
* Add rate limiting for `/consume` endpoints to avoid abuse.

---

## 🧩 Future Enhancements

* Add bulk consumption APIs and support custom `units` parameter.
* Add admin endpoints to top-up feature units for subscriptions.
* Add scheduled jobs to expire subscriptions and reclaim resources.
* Add metrics & monitoring (Prometheus/Grafana) for usage patterns.
* Add unit and integration tests for transactional consumption flows.

---

© 2025 TVS — Plan Usage & Subscription Service
