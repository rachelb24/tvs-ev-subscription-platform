Of course. Here is a comprehensive `README.md` file for your Plan Management Microservice, based on the `PlanController` you provided.

***

# Plan Management Microservice

This microservice is a Spring Boot application responsible for managing subscription plans for the TVS EV platform. It handles the creation, retrieval, updating, deletion, and pricing of various subscription plans.

## Overview

The Plan Service provides a RESTful API for all operations related to subscription plans. It allows administrators to define plans, associate them with specific features, set jejich prices, and manage their lifecycle (active/inactive). It also provides a dynamic price preview functionality for clients to calculate costs based on selected features.

This service is designed to be a part of a larger microservices architecture, communicating with other services like a Feature Service or a User Service.

## Features

*   **CRUD Operations:** Full support for creating, reading, updating, and deleting plans.
*   **Plan Lifecycle Management:** Activate or deactivate plans to control their availability.
*   **Dynamic Price Calculation:** A `preview` endpoint to calculate the total price of a plan based on a given list of features.
*   **Data Validation:** In-built validation for incoming requests to ensure data integrity.
*   **CORS Enabled:** Pre-configured to accept requests from frontend applications running on `http://localhost:5173` and `http://localhost:5174`.

## Technologies Used

*   **Java 21+**
*   **Spring Boot 3.x**
*   **Spring Web:** For building RESTful APIs.
*   **Spring Data JPA:** For database interaction.
*   **Lombok:** To reduce boilerplate code.
*   **Jakarta Bean Validation:** For request DTO validation.
*   **Maven:** For dependency management and build automation.
*   **Database:** (e.g., PostgreSQL, MySQL)
*   **Docker:** For containerization.

## API Endpoints

The base path for all endpoints is `/api/v1/plans`.

| HTTP Method | URI Path                     | Description                                                                                             | Sample Request Body                                                                      |
| :---------- | :--------------------------- | :------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------- |
| `POST`      | `/`                          | Creates a new subscription plan. Returns the created plan.                                              | `{ "name": "Premium Plan", "description": "All features included", "featureIds": [...] }`    |
| `GET`       | `/`                          | Retrieves a list of all plans, regardless of their status.                                              | N/A                                                                                      |
| `GET`       | `/{planId}`                  | Retrieves a single plan by its unique ID.                                                               | N/A                                                                                      |
| `PUT`       | `/{planId}`                  | Updates an existing plan.                                                                               | `{ "name": "Premium Plan+", "description": "All features and more", "featureIds": [...] }` |
| `DELETE`    | `/{planId}`                  | Deletes a plan by its ID.                                                                               | N/A                                                                                      |
| `GET`       | `/active`                    | Retrieves a list of all currently active plans.                                                         | N/A                                                                                      |
| `POST`      | `/{planId}/activate`         | Sets a plan's status to active.                                                                         | N/A                                                                                      |
| `POST`      | `/{planId}/deactivate`       | Sets a plan's status to inactive.                                                                       | NA                                                                                       |
aws
| `GET`       | `/preview?featureIds=<uuid>&featureIds=<uuid>` | Calculates and returns the total price for a given list of feature IDs without creating a plan. | N/A                                                                                      |

## Getting Started

### Prerequisites

*   JDK 21 or later
*   Maven 3.8+
*   A running instance of a PostgreSQL or MySQL database.
*   Docker (for containerized deployment)

### Configuration

Create an `application.properties` file in `src/main/resources` and configure it with your database and server settings.

```properties
# Server Configuration
server.port=8081
spring.application.name=plan-service

# Database Configuration (Example for PostgreSQL)
spring.datasource.url=jdbc:postgresql://localhost:5432/plan_db
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Eureka Client (if used)
# eureka.client.serviceUrl.defaultZone=http://localhost:8761/eureka
```

### How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd plan-service
    ```

2.  **Build the project:**
    Use Maven to compile the code and package it as a JAR file.
    ```bash
    mvn clean install
    ```

3.  **Run the application:**
    ```bash
    java -jar target/plan-service-0.0.1-SNAPSHOT.jar
    ```
    The service will start on the port specified in your `application.properties` (e.g., 8081).

## Containerization with Docker

To run this microservice as a Docker container, follow these steps.

### 1. Enable Spring Boot Layered JARs

Add the following configuration to your `pom.xml` inside the `<build>` section to enable layered JARs, which optimizes Docker image creation.

```xml
<plugins>
    <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <configuration>
            <layers>
                <enabled>true</enabled>
            </layers>
        </configuration>
    </plugin>
</plugins>
```

### 2. Create a `Dockerfile`

Create a `Dockerfile` in the root of your project. This multi-stage build creates a lean, production-ready image.

```dockerfile
# Stage 1: Build stage
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline
COPY src ./src
RUN ./mvnw clean install -DskipTests

# Stage 2: Extract layers for optimized Docker image
FROM builder AS extractor
WORKDIR /app
RUN java -Djarmode=layertools -jar target/*.jar extract

# Stage 3: Final image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
ENV SERVER_PORT=8081
EXPOSE ${SERVER_PORT}

# Copy extracted layers
COPY --from=extractor /app/dependencies/ ./
COPY --from=extractor /app/spring-boot-loader/ ./
COPY --from=extractor /app/snapshot-dependencies/ ./
COPY --from=extractor /app/application/ ./

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

### 3. Build and Run the Docker Image

1.  **Build the image:**
    ```bash
    docker build -t tvs/plan-service:latest .
    ```

2.  **Run the container:**
    ```bash
    docker run -p 8081:8081 \
      -e SPRING_DATASOURCE_URL=jdbc:postgresql://<host-ip-or-service-name>:5432/plan_db \
      -e SPRING_DATASOURCE_USERNAME=your_username \
      -e SPRING_DATASOURCE_PASSWORD=your_password \
      tvs/plan-service:latest
    ```
    *Note: Replace database credentials and URL as needed. Use your machine's IP address or a Docker network service name instead of `localhost` when connecting to a database from within a container.*

[1](https://spring.io/guides/gs/spring-boot-docker)
[2](https://www.docker.com/blog/9-tips-for-containerizing-your-spring-boot-code/)
[3](https://docs.spring.io/spring-boot/reference/packaging/container-images/efficient-images.html)
[4](https://blog.devops.dev/docker-dockerizing-your-spring-boot-application-8ec6bae74994)
[5](https://bell-sw.com/videos/dockerize-spring-boot-wisely-6-tips-to-improve-the-container-images-of-your-spring-boot-apps/)
[6](https://mydeveloperplanet.com/2022/12/14/spring-boot-docker-best-practices/)
[7](https://www.codewalnut.com/insights/spring-boot-best-practices-for-scalable-applications)
[8](https://www.youtube.com/watch?v=azUTJdN3PAA)