package com.tvs.util;


import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * JPA AttributeConverter to persist List<UUID> as a comma-separated string and vice versa.
 */
@Converter
public class UUIDListConverter implements AttributeConverter<List<UUID>, String> {

    private static final String SPLIT_CHAR = ",";

    @Override
    public String convertToDatabaseColumn(List<UUID> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return "";
        }
        return attribute.stream()
                .map(UUID::toString)
                .collect(Collectors.joining(SPLIT_CHAR));
    }

    @Override
    public List<UUID> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(dbData.split(SPLIT_CHAR))
                .map(UUID::fromString)
                .collect(Collectors.toList());
    }
}
