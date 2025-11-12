# 🚗 TVS User Management & Authentication Service

A production-grade Spring Boot backend for **user authentication, profile management, and vehicle tracking**, with JWT-based authorization and OTP-based password reset. Built for **scalability, security**, and **easy microservice integration**.

---

## 🧩 Key Features

### 🔐 Authentication & Security

* Register and login with JWT tokens
* Passwords encrypted using BCrypt
* Role-based access control (`USER` / `ADMIN`)
* Secure JWT validation for all protected endpoints

### 👤 User Management

* Get & update your own profile (via JWT)
* View all users (admin only)
* Vehicle information linked to user account
* Retrieve user info by ID or email

### 🔄 Password Management

* OTP-based password reset (email integration)
* OTP expiry (10 minutes auto invalidation)
* Secure password update with old-password verification

---

## 🏗️ Tech Stack

| Layer          | Technology                           |
| -------------- | ------------------------------------ |
| **Framework**  | Spring Boot 3.x                      |
| **Security**   | Spring Security + JWT                |
| **Database**   | JPA (Hibernate) + MySQL / PostgreSQL |
| **Validation** | Jakarta Validation                   |
| **Networking** | Spring WebClient                     |
| **Encryption** | BCryptPasswordEncoder                |
| **Language**   | Java 17+                             |

---

## 📁 Folder Structure

```
src/main/java/com/tvs
│
├── controller/
│   ├── AuthController.java       // Handles registration, login, password reset
│   └── UserController.java       // Manages profiles and admin user operations
│
├── service/
│   ├── AuthService.java          // Login, JWT generation
│   ├── UserService.java          // Registration, OTP, profile, password updates
│   └── OrderClientService.java   // (Optional) External order API integration
│
├── entity/
│   ├── User.java                 // User entity
│   ├── Vehicle.java              // Linked vehicle info
│   └── PasswordOtp.java          // OTP management entity
│
├── dto/                          // Request & Response data models
└── util/
    └── JwtUtil.java              // JWT token generation/validation
```

---

## ⚙️ Setup Instructions

### ✅ Prerequisites

* Java 17+
* Maven 3.8+
* MySQL / PostgreSQL
* Email microservice running at: `http://localhost:9090/api/notifications/send-email`

### 🚀 Steps to Run

1. **Clone the repo**

```bash
git clone https://github.com/yourusername/tvs-auth-service.git
cd tvs-auth-service
```

2. **Configure database & JWT secret**

Create or update `src/main/resources/application.properties` (or `application.yml`) with your configuration. Example `application.properties`:

```properties
# src/main/resources/application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/tvsdb
spring.datasource.username=root
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update

jwt.secret=your_secret_key
server.port=9004
```

> If you prefer YAML, convert the same properties into `application.yml`.

3. **Build & Run**

```bash
mvn clean install
mvn spring-boot:run
```

4. **Access**

Base URL → `http://localhost:9004/api/users`

### 🧠 Authentication

All secured endpoints require a JWT token. Include this header in requests:

```
Authorization: Bearer <your_token_here>
```

---

## 📘 API Documentation (examples)

> Below are representative endpoints and sample request / response payloads.

### 🧾 Authentication APIs

#### 🟢 Register User

**Endpoint:** `POST /api/users/register`

**Request:**

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "123456",
  "mobile": "9876543210",
  "vehicleName": "Car",
  "vehicleModelYear": 2023
}
```

**Response:**

```json
{
  "userId": "eab3df02-33b9-4b14-b736-fcadb3820e7a",
  "fullName": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "vehicleName": "Car",
  "vehicleModelYear": 2023,
  "isActive": true
}
```

---

#### 🟢 Login User

**Endpoint:** `POST /api/users/login`

**Request:**

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "message": "Login successful",
  "role": "USER"
}
```

---

#### 🔄 Forgot Password (Send OTP)

**Endpoint:** `POST /api/users/forgot-password/request`

**Request:**

```json
{
  "email": "john@example.com"
}
```

**Response (example):**

```
"OTP sent successfully to john@example.com"
```

---

#### 🔒 Verify OTP & Reset Password

**Endpoint:** `POST /api/users/forgot-password/verify`

**Request:**

```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newPass123"
}
```

**Response (example):**

```
"Password reset successfully"
```

---

#### 🧰 Update Password (JWT Required)

**Endpoint:** `PUT /api/users/update-password`

**Header:**

```
Authorization: Bearer <token>
```

**Request:**

```json
{
  "oldPassword": "123456",
  "newPassword": "newPass789"
}
```

**Response (example):**

```
"Password updated successfully"
```

---

## 👤 User APIs

### 🧑 Get Own Profile

**Endpoint:** `GET /api/users/profile`

**Header:**

```
Authorization: Bearer <token>
```

**Response (example):**

```json
{
  "userId": "eab3df02-33b9-4b14-b736-fcadb3820e7a",
  "fullName": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "vehicleName": "Car",
  "vehicleModelYear": 2023,
  "plans": [
    {
      "planId": "d42a7d63-44aa-498b-a22e-8393e9b5e87e",
      "planName": "Premium Plan",
      "expiryDate": "2025-12-31"
    }
  ]
}
```

---

### ✏️ Update Profile

**Endpoint:** `PUT /api/users/profile`

**Header:**

```
Authorization: Bearer <token>
```

**Request:**

```json
{
  "fullName": "John Updated",
  "email": "john@example.com",
  "mobile": "9123456789",
  "vehicleName": "SUV",
  "vehicleModelYear": 2024
}
```

**Response (example):**

```json
{
  "userId": "eab3df02-33b9-4b14-b736-fcadb3820e7a",
  "fullName": "John Updated",
  "email": "john@example.com",
  "mobile": "9123456789",
  "vehicleName": "SUV",
  "vehicleModelYear": 2024
}
```

---

### 👥 Get All Users (Admin Only)

**Endpoint:** `GET /api/users/all`

**Header:**

```
Authorization: Bearer <admin_token>
```

**Response (example):**

```json
[
  {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "fullName": "Alice",
    "email": "alice@example.com",
    "vehicleName": "Bike",
    "vehicleModelYear": 2022
  },
  {
    "userId": "456e4567-e89b-12d3-a456-426614174111",
    "fullName": "Bob",
    "email": "bob@example.com",
    "vehicleName": "Car",
    "vehicleModelYear": 2023
  }
]
```

---

### 🔍 Get User by ID

**Endpoint:** `GET /api/users/{userId}`

**Example:**

```
GET /api/users/123e4567-e89b-12d3-a456-426614174000
```

**Response (example):**

```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "fullName": "Alice",
  "email": "alice@example.com",
  "mobile": "9998887777",
  "vehicleName": "Bike",
  "vehicleModelYear": 2022
}
```

---

### 📧 Get User ID by Email

**Endpoint:** `GET /api/users/by-email/{email}`

**Example:**

```
GET /api/users/by-email/john@example.com
```

**Response (example):**

```
"eab3df02-33b9-4b14-b736-fcadb3820e7a"
```

---

## 🧾 Error Responses

| Status | Description                          |
| ------ | ------------------------------------ |
| 400    | Invalid input or missing fields      |
| 401    | Unauthorized (missing/invalid token) |
| 403    | Forbidden (no admin privileges)      |
| 404    | Resource not found                   |
| 500    | Internal server error                |

**Example error body:**

```json
{
  "timestamp": "2025-11-01T14:05:22.345+00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Email already registered"
}
```

---

## 📧 Email OTP Service Integration

**Endpoint:**

```
POST http://localhost:9090/api/notifications/send-email
```

**Request Body Example:**

```json
{
  "to": "user@example.com",
  "subject": "Password Reset OTP",
  "body": "Your OTP for password reset is: 123456. It expires in 10 minutes."
}
```

---

## 🧠 Notes

* OTPs expire after 10 minutes.
* Default user role → `USER`.
* Admin can view all users via `/api/users/all`.
* Vehicle information is optional but recommended during registration.

---

## 🧩 Future Enhancements

* Refresh token implementation
* Email template customization
* Admin dashboard UI
* SMS-based OTP system

---

© 2025 TVS — TVS User 
