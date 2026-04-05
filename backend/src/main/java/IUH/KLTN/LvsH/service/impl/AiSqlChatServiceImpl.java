package IUH.KLTN.LvsH.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import IUH.KLTN.LvsH.dto.AiSqlChatResponseDTO;
import IUH.KLTN.LvsH.service.AiSqlChatService;
import IUH.KLTN.LvsH.service.ai.SqlSafetyValidator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiSqlChatServiceImpl implements AiSqlChatService {

    private static final String VI_ACCENTED_CHARS = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";
    private static final String VI_ASCII_CHARS = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiioooooooooooooooooouuuuuuuuuuuyyyyyd";

    private static final Pattern STRICT_TEXT_FILTER_PATTERN = Pattern.compile(
            "\\b([a-zA-Z_][a-zA-Z0-9_]*\\.(?:name|code|short_name))\\b\\s*=\\s*'([^']+)'",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern ILIKE_TEXT_FILTER_PATTERN = Pattern.compile(
            "\\b([a-zA-Z_][a-zA-Z0-9_]*\\.(?:name|code|short_name))\\b\\s+ILIKE\\s+'([^']*)'",
            Pattern.CASE_INSENSITIVE
    );

    private static final String SYSTEM_PROMPT = """
            Bạn là trợ lý tạo SQL cho hệ thống POS/kho.

            Nhiệm vụ:
            - Chuyển câu hỏi tiếng Việt của nhân viên thành đúng 1 câu SQL SELECT.
            - Chỉ trả về SQL, không giải thích, không markdown.

            Ràng buộc bắt buộc:
            - Chỉ được dùng SELECT.
            - Không dùng INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, GRANT, REVOKE, CALL.
            - Không được trả về nhiều hơn 1 câu lệnh.
            - Nếu truy vấn có thể trả nhiều dòng, thêm LIMIT 20.
            - Chỉ được dùng đúng tên bảng và tên cột trong schema bên dưới.
            - Không được query bảng staff.
            - Khi lọc theo tên hoặc mã (name, code, short_name), luôn ưu tiên tìm gần đúng bằng ILIKE với %%keyword%%; hạn chế tối đa so sánh bằng '='.
            - Mặc định phải tìm không dấu ngay trong SQL cho name/code/short_name để user gõ không dấu vẫn khớp dữ liệu có dấu (ví dụ: 'kho chinh' khớp 'Kho Chính').
                        - Quy tắc thời gian/ngày bắt buộc:
                            + Múi giờ mặc định khi hiểu câu hỏi là Asia/Ho_Chi_Minh.
                            + Với cột TIMESTAMP (ví dụ: orders.order_time, goods_receipts.receipt_date, returns.return_date, purchase_orders.order_date): KHÔNG dùng kiểu order_time::date = CURRENT_DATE.
                            + Với cột TIMESTAMP, phải lọc theo khoảng thời gian [đầu kỳ, cuối kỳ), ví dụ hôm nay:
                                order_time >= date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
                                AND order_time < date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') + INTERVAL '1 day'.
                            + "Hôm qua": lùi 1 ngày từ mốc trên; "7 ngày gần đây": từ mốc đầu ngày - INTERVAL '6 day' đến < mốc đầu ngày + INTERVAL '1 day'.
                            + "Tháng này" dùng date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh'); "năm nay" dùng date_trunc('year', ...).
                            + Chỉ dùng = CURRENT_DATE cho cột kiểu DATE thuần.
                        - Với truy vấn tổng hợp SUM/AVG/COUNT theo ngày kỳ, ưu tiên COALESCE cho SUM/AVG để không trả về NULL.
            

            Schema duoc phep dung:
            categories(id, name, slug, is_active, deleted_at)
            customers(id, customer_code, name, phone, email, tax_code, address, is_active, deleted_at, created_at)
            suppliers(id, supplier_code, name, phone, tax_code, address, is_active, deleted_at)
            products(id, sku, barcode, name, short_name, category_id, sale_price, avg_cost, last_purchase_cost, vat_rate, image_url, is_active, deleted_at, created_at, updated_at)
            warehouse(id, code, name, address, is_active, deleted_at)
            coupons(id, code, discount_type, discount_value, min_order_amount, max_discount_amount, starts_at, ends_at, usage_limit, used_count, is_active, deleted_at, created_at)
            purchase_orders(id, po_no, supplier_id, warehouse_id, total_amount, total_vat, total_amount_payable, order_date, expected_date, status, note, created_by, created_at)
            purchase_order_items(id, po_id, product_id, ordered_qty, expected_unit_cost, line_total)
            goods_receipts(id, gr_no, po_id, supplier_id, warehouse_id, total_amount, total_vat, total_amount_payable, receipt_date, status, note, created_by, created_at)
            goods_receipt_items(id, gr_id, po_item_id, product_id, received_qty, unit_cost, line_total)
            orders(id, order_no, sales_channel, customer_id, warehouse_id, order_time, status, gross_amount, discount_amount, coupon_code, coupon_discount_amount, surcharge_amount, net_amount, payment_method, note, created_by, created_at)
            order_items(id, order_id, product_id, qty, sale_price, cost_at_sale, line_revenue, line_cogs, line_profit)
            customer_returns(id, return_no, customer_id, order_id, warehouse_id, total_refund, return_date, status, note, created_by, created_at)
            customer_return_items(id, customer_return_id, order_item_id, product_id, qty, refund_amount, note)
            supplier_returns(id, return_no, supplier_id, goods_receipt_id, warehouse_id, total_amount, total_vat, total_amount_payable, return_date, status, note, created_by, created_at)
            supplier_return_items(id, supplier_return_id, goods_receipt_item_id, product_id, qty, return_amount, note)
            inventory_movements(id, product_id, warehouse_id, movement_type, qty, ref_table, ref_id, note, created_by, created_at)
            inventory_balance(warehouse_id, product_id, on_hand, updated_at)
            stock_adjustments(id, adjust_no, warehouse_id, adjust_date, status, reason, note, created_by, created_at)
            stock_adjustment_items(id, adjustment_id, product_id, system_qty, actual_qty, diff_qty, unit_cost_snapshot, note)

            Relationships:
            products.category_id = categories.id
            purchase_orders.supplier_id = suppliers.id
            purchase_orders.warehouse_id = warehouse.id
            purchase_order_items.po_id = purchase_orders.id
            purchase_order_items.product_id = products.id
            goods_receipts.po_id = purchase_orders.id
            goods_receipts.supplier_id = suppliers.id
            goods_receipts.warehouse_id = warehouse.id
            goods_receipt_items.gr_id = goods_receipts.id
            goods_receipt_items.po_item_id = purchase_order_items.id
            goods_receipt_items.product_id = products.id
            orders.customer_id = customers.id
            orders.warehouse_id = warehouse.id
            order_items.order_id = orders.id
            order_items.product_id = products.id
            customer_returns.customer_id = customers.id
            customer_returns.order_id = orders.id
            customer_returns.warehouse_id = warehouse.id
            customer_return_items.customer_return_id = customer_returns.id
            customer_return_items.order_item_id = order_items.id
            customer_return_items.product_id = products.id
            supplier_returns.supplier_id = suppliers.id
            supplier_returns.goods_receipt_id = goods_receipts.id
            supplier_returns.warehouse_id = warehouse.id
            supplier_return_items.supplier_return_id = supplier_returns.id
            supplier_return_items.goods_receipt_item_id = goods_receipt_items.id
            supplier_return_items.product_id = products.id
            inventory_movements.product_id = products.id
            inventory_movements.warehouse_id = warehouse.id
            inventory_balance.product_id = products.id
            inventory_balance.warehouse_id = warehouse.id
            stock_adjustments.warehouse_id = warehouse.id
            stock_adjustment_items.adjustment_id = stock_adjustments.id
            stock_adjustment_items.product_id = products.id
            """;

    private static final String EXPLAIN_SYSTEM_PROMPT = """
            Bạn là trợ lý phân tích dữ liệu POS/kho.
            Nhiệm vụ:
            - Dựa vào câu hỏi, câu SQL đã chạy, và kết quả truy vấn JSON.
            - Trả lời bằng tiếng Việt rõ ràng, ngắn gọn, để nhân viên dễ hiểu.
            - Nếu không có dữ liệu, nói rõ không tìm thấy dữ liệu phù hợp.
            - Không tạo số liệu mới, chỉ được dựa trên kết quả đã cho.
            - Không dùng markdown.
            """;

    private final JdbcTemplate jdbcTemplate;
    private final SqlSafetyValidator sqlSafetyValidator;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.ai.sql.api-url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.ai.sql.api-key:}")
    private String apiKey;

    @Value("${app.ai.sql.model:gpt-4o-mini}")
    private String model;

    @Value("${app.ai.sql.timeout-ms:60000}")
    private int timeoutMs;

    @Value("${app.ai.sql.explain-enabled:true}")
    private boolean explainEnabled;

    @Value("${app.ai.sql.explain-max-rows:20}")
    private int explainMaxRows;

    @Override
    public AiSqlChatResponseDTO ask(String question) {
        long start = System.currentTimeMillis();

        String generatedSql = generateSql(question);
        String safeSql = sqlSafetyValidator.validateAndNormalize(generatedSql);

        // Force accent-insensitive matching directly in the main SQL execution path.
        String normalizedSql = buildAccentInsensitiveSql(safeSql);
        if (!normalizedSql.equals(safeSql)) {
            safeSql = sqlSafetyValidator.validateAndNormalize(normalizedSql);
        }

        String executedSql = safeSql;
        QueryExecution firstExecution = executeSql(executedSql);
        executedSql = firstExecution.sql;
        List<Map<String, Object>> rows = firstExecution.rows;
        if (rows.isEmpty()) {
            String relaxedSql = buildFuzzyFallbackSql(executedSql);
            if (!relaxedSql.equals(executedSql)) {
                String safeRelaxedSql = sqlSafetyValidator.validateAndNormalize(relaxedSql);
                QueryExecution relaxedExecution = executeSql(safeRelaxedSql);
                List<Map<String, Object>> relaxedRows = relaxedExecution.rows;
                if (!relaxedRows.isEmpty()) {
                    rows = relaxedRows;
                    executedSql = relaxedExecution.sql;
                    log.info("AI SQL fallback applied. original='{}', fallback='{}', rowCount={}", safeSql, executedSql, rows.size());
                }
            }
        }

        if (rows.isEmpty()) {
            String accentSql = buildAccentNormalizedSql(executedSql);
            if (!accentSql.equals(executedSql)) {
                String safeAccentSql = sqlSafetyValidator.validateAndNormalize(accentSql);
                try {
                    QueryExecution accentExecution = executeSql(safeAccentSql);
                    List<Map<String, Object>> accentRows = accentExecution.rows;
                    if (!accentRows.isEmpty()) {
                        rows = accentRows;
                        executedSql = accentExecution.sql;
                        log.info("AI SQL accent fallback applied. sql='{}', rowCount={}", executedSql, rows.size());
                    }
                } catch (RuntimeException ex) {
                    log.warn("AI SQL accent fallback skipped. reason={}", ex.getMessage());
                }
            }
        }

        int rowCount = rows.size();
        String summary = summarize(rows);

        String answer = summary;
        if (explainEnabled) {
            try {
                answer = explainResult(question, safeSql, rows, rowCount, summary);
            } catch (Exception ex) {
                log.warn("AI explanation failed, fallback to summary. reason={}", ex.getMessage());
            }
        }

        long duration = System.currentTimeMillis() - start;
        log.info("AI SQL chat: question='{}', sql='{}', rowCount={}, durationMs={}", question, executedSql, rowCount, duration);

        return AiSqlChatResponseDTO.builder()
                .question(question)
            .sql(executedSql)
                .answer(answer)
                .summary(summary)
                .rowCount(rowCount)
                .rows(rows)
                .build();
    }

    private String generateSql(String question) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("Missing app.ai.sql.api-key (or OPENAI_API_KEY) in environment");
        }

        try {
            String rawSql = callChatCompletion(SYSTEM_PROMPT, question);
            if (rawSql.isBlank()) {
                throw new RuntimeException("AI returned empty SQL");
            }
            return cleanupSql(rawSql);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to generate SQL: " + ex.getMessage(), ex);
        }
    }

    private String explainResult(String question, String sql, List<Map<String, Object>> rows, int rowCount, String fallbackSummary) {
        List<Map<String, Object>> sampleRows = rows.stream().limit(Math.max(1, explainMaxRows)).toList();

        String prompt = """
                Cau hoi: %s
                SQL da chay:
                %s

                So dong ket qua: %d
                Ket qua (JSON):
                %s

                Goi y fallback: %s
                """.formatted(
                question,
                sql,
                rowCount,
                toJson(sampleRows),
                fallbackSummary
        );

        String explained = callChatCompletion(EXPLAIN_SYSTEM_PROMPT, prompt);
        if (explained == null || explained.isBlank()) {
            return fallbackSummary;
        }
        return explained.trim();
    }

    private String callChatCompletion(String systemPrompt, String userPrompt) {
        try {
            String payload = buildPayload(systemPrompt, userPrompt);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .timeout(Duration.ofMillis(timeoutMs))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(timeoutMs))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("AI provider error: HTTP " + response.statusCode() + " - " + response.body());
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
            return contentNode.asText("").trim();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to call AI provider: " + ex.getMessage(), ex);
        }
    }

    private String buildPayload(String systemPrompt, String userPrompt) {
        try {
            Map<String, Object> body = Map.of(
                    "model", model,
                    "temperature", 0,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userPrompt)
                    )
            );
            return objectMapper.writeValueAsString(body);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to build AI request payload", ex);
        }
    }

    private String cleanupSql(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace("```sql", "").replace("```", "").trim();
        }

        List<String> lines = new ArrayList<>();
        for (String line : cleaned.split("\\R")) {
            if (!line.isBlank()) {
                lines.add(line);
            }
        }
        return String.join("\n", lines).trim();
    }

    private String summarize(List<Map<String, Object>> rows) {
        if (rows.isEmpty()) {
            return "Không tìm thấy dữ liệu phù hợp.";
        }
        Map<String, Object> first = rows.get(0);
        String sample = first.entrySet().stream()
                .limit(3)
                .map(e -> e.getKey() + "=" + String.valueOf(e.getValue()))
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
        return "Tìm thấy " + rows.size() + " dòng. Mẫu: " + sample;
    }

    private String buildFuzzyFallbackSql(String sql) {
        Matcher matcher = STRICT_TEXT_FILTER_PATTERN.matcher(sql);
        StringBuffer result = new StringBuffer();
        boolean replaced = false;

        while (matcher.find()) {
            replaced = true;
            String columnRef = matcher.group(1);
            String literal = matcher.group(2).trim();
            String escaped = literal.replace("'", "''");
            String replacement = columnRef + " ILIKE '%" + escaped + "%'";
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);

        return replaced ? result.toString() : sql;
    }

    private String buildAccentInsensitiveSql(String sql) {
        String fuzzySql = buildFuzzyFallbackSql(sql);
        return buildAccentNormalizedSql(fuzzySql);
    }

    private String buildAccentNormalizedSql(String sql) {
        Matcher matcher = ILIKE_TEXT_FILTER_PATTERN.matcher(sql);
        StringBuffer result = new StringBuffer();
        boolean replaced = false;

        while (matcher.find()) {
            replaced = true;
            String columnRef = matcher.group(1);
            String literal = matcher.group(2).replace("'", "''");
            String replacement = normalizeExpr(columnRef) + " ILIKE " + normalizeExpr("'" + literal + "'");
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);

        return replaced ? result.toString() : sql;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return "[]";
        }
    }

    private QueryExecution executeSql(String sql) {
        return new QueryExecution(sql, jdbcTemplate.queryForList(sql));
    }

    private String normalizeExpr(String expression) {
        return "translate(lower(" + expression + "), '" + VI_ACCENTED_CHARS + "', '" + VI_ASCII_CHARS + "')";
    }

    private static class QueryExecution {
        private final String sql;
        private final List<Map<String, Object>> rows;

        private QueryExecution(String sql, List<Map<String, Object>> rows) {
            this.sql = sql;
            this.rows = rows;
        }
    }
}