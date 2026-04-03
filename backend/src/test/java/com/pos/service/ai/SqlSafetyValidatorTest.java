package com.pos.service.ai;

import org.junit.jupiter.api.Test;

import com.pos.service.ai.SqlSafetyValidator;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SqlSafetyValidatorTest {

    private final SqlSafetyValidator validator = new SqlSafetyValidator();

    @Test
    void validateAndNormalize_shouldAppendLimitWhenMissing() {
        String sql = "SELECT id, name FROM products";
        String normalized = validator.validateAndNormalize(sql);

        assertEquals("SELECT id, name FROM products\nLIMIT 20", normalized);
    }

    @Test
    void validateAndNormalize_shouldRejectNonSelect() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> validator.validateAndNormalize("DELETE FROM products"));

        assertEquals("Only SELECT SQL is allowed", ex.getMessage());
    }

    @Test
    void validateAndNormalize_shouldAcceptTrailingSemicolon() {
        String normalized = validator.validateAndNormalize("SELECT * FROM products;");

        assertEquals("SELECT * FROM products\nLIMIT 20", normalized);
    }

    @Test
    void validateAndNormalize_shouldRejectInnerSemicolon() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> validator.validateAndNormalize("SELECT * FROM products; SELECT * FROM orders"));

        assertEquals("Multiple SQL statements are not allowed", ex.getMessage());
    }

    @Test
    void validateAndNormalize_shouldRejectForbiddenTable() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> validator.validateAndNormalize("SELECT id, username FROM staff"));

        assertEquals("Table is not allowed: staff", ex.getMessage());
    }
}
