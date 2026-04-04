package IUH.KLTN.LvsH.backend_refactor.service.ai;

import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SqlSafetyValidator {

    private static final Pattern SELECT_START = Pattern.compile("^\\s*select\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern HAS_LIMIT = Pattern.compile("\\blimit\\s+\\d+\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern TABLE_PATTERN = Pattern.compile("\\b(?:from|join)\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\b", Pattern.CASE_INSENSITIVE);

    private static final Set<String> BANNED_KEYWORDS = Set.of(
            "insert", "update", "delete", "drop", "alter", "truncate", "create",
            "grant", "revoke", "execute", "call", "copy"
    );

    private static final Set<String> ALLOWED_TABLES = Set.of(
            "categories", "customers", "suppliers", "products", "warehouse", "coupons",
            "purchase_orders", "purchase_order_items", "goods_receipts", "goods_receipt_items",
            "orders", "order_items", "customer_returns", "customer_return_items",
            "supplier_returns", "supplier_return_items", "inventory_movements", "inventory_balance",
            "stock_adjustments", "stock_adjustment_items"
    );

    public String validateAndNormalize(String rawSql) {
        if (rawSql == null || rawSql.isBlank()) {
            throw new RuntimeException("Generated SQL is empty");
        }

        String sql = rawSql.trim();

        // Allow one trailing semicolon from LLM output, but never allow multi-statement SQL.
        if (sql.endsWith(";")) {
            sql = sql.substring(0, sql.length() - 1).trim();
        }

        if (!SELECT_START.matcher(sql).find()) {
            throw new RuntimeException("Only SELECT SQL is allowed");
        }
        if (sql.contains(";")) {
            throw new RuntimeException("Multiple SQL statements are not allowed");
        }
        if (sql.contains("--") || sql.contains("/*") || sql.contains("*/")) {
            throw new RuntimeException("SQL comments are not allowed");
        }

        String lowered = sql.toLowerCase(Locale.ROOT);
        for (String keyword : BANNED_KEYWORDS) {
            if (containsWord(lowered, keyword)) {
                throw new RuntimeException("Forbidden SQL keyword detected: " + keyword);
            }
        }

        validateTables(sql);

        if (!HAS_LIMIT.matcher(sql).find()) {
            sql = sql + "\nLIMIT 20";
        }

        return sql;
    }

    private void validateTables(String sql) {
        Matcher matcher = TABLE_PATTERN.matcher(sql);
        boolean foundAny = false;
        while (matcher.find()) {
            foundAny = true;
            String table = matcher.group(1).toLowerCase(Locale.ROOT);
            if (!ALLOWED_TABLES.contains(table)) {
                throw new RuntimeException("Table is not allowed: " + table);
            }
        }

        if (!foundAny) {
            throw new RuntimeException("Cannot detect table in SQL");
        }
    }

    private boolean containsWord(String text, String word) {
        Pattern p = Pattern.compile("\\b" + Pattern.quote(word) + "\\b", Pattern.CASE_INSENSITIVE);
        return p.matcher(text).find();
    }
}
