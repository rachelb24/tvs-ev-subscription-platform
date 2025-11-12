// src/main/java/com/tvs/exception/VehicleNotRegisteredException.java
package com.tvs.exception;

public class VehicleNotRegisteredException extends RuntimeException {
    public VehicleNotRegisteredException(String message) {
        super(message);
    }
}
