package IUH.KLTN.LvsH.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SalesSummaryReportDTO {
    private BigDecimal netRevenue;
    private BigDecimal totalReturns;
    private BigDecimal cogs;
    private BigDecimal stockAdjustments;
    private BigDecimal grossProfit;
}
