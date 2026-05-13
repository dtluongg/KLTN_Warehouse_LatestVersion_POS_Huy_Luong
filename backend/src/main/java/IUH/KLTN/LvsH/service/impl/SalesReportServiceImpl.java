package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.SalesSummaryReportDTO;
import IUH.KLTN.LvsH.repository.CustomerReturnRepository;
import IUH.KLTN.LvsH.repository.OrderItemRepository;
import IUH.KLTN.LvsH.repository.StockAdjustmentRepository;
import IUH.KLTN.LvsH.service.SalesReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SalesReportServiceImpl implements SalesReportService {

    private final OrderItemRepository orderItemRepository;
    private final CustomerReturnRepository customerReturnRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;

    @Override
    public SalesSummaryReportDTO getSalesSummaryReport(Long warehouseId, LocalDateTime fromDate, LocalDateTime toDate) {
        // 1. Get Gross Revenue and Profit
        OrderItemRepository.GrossRevenueProfitProjection projection = orderItemRepository.getGrossRevenueAndProfitInPeriod(warehouseId, fromDate, toDate);
        BigDecimal grossRevenue = projection != null && projection.getRevenue() != null ? projection.getRevenue() : BigDecimal.ZERO;
        BigDecimal profit = projection != null && projection.getProfit() != null ? projection.getProfit() : BigDecimal.ZERO;

        // COGS = Gross Revenue - Profit
        BigDecimal cogs = grossRevenue.subtract(profit);

        // Net Revenue is Gross Revenue for now (if discounts are applied at line level, it's already net)
        BigDecimal netRevenue = grossRevenue;

        // 2. Get Total Returns
        BigDecimal totalReturns = customerReturnRepository.sumRefundAmountInPeriod(warehouseId, fromDate, toDate);
        if (totalReturns == null) totalReturns = BigDecimal.ZERO;

        // 3. Get Stock Adjustments (Losses)
        BigDecimal stockAdjustments = stockAdjustmentRepository.sumLostStockValueInPeriod(warehouseId, fromDate, toDate);
        if (stockAdjustments == null) stockAdjustments = BigDecimal.ZERO;
        
        // Hao hụt kho là số âm, nhưng ta biểu diễn dương trên báo cáo
        BigDecimal displayStockAdjustments = stockAdjustments.abs();

        // 4. Calculate Gross Profit
        // Gross Profit = Net Revenue - Total Returns - COGS - displayStockAdjustments
        BigDecimal grossProfit = netRevenue.subtract(totalReturns).subtract(cogs).subtract(displayStockAdjustments);

        return SalesSummaryReportDTO.builder()
                .netRevenue(netRevenue)
                .totalReturns(totalReturns)
                .cogs(cogs)
                .stockAdjustments(displayStockAdjustments)
                .grossProfit(grossProfit)
                .build();
    }
}
