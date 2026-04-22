package IUH.KLTN.LvsH.dto;

import lombok.Builder;
import lombok.Value;
import java.math.BigDecimal;

@Value
@Builder
public class InventoryTurnoverReportDTO {
    Long warehouseId;
    String warehouseName;
    Long productId;
    String sku;
    String productName;
    Integer quantitySold; // số lượng bán trong kỳ
    BigDecimal revenue; // doanh thu
    BigDecimal cogs; // giá vốn
    Integer avgInventoryQty; // tồn bình quân
    BigDecimal avgInventoryValue; // giá trị tồn bình quân
    BigDecimal turnoverRatio; // COGS / avg inventory value (số lần)
    BigDecimal daysInventoryOutstanding; // 365 / turnover ratio (số ngày)
}
