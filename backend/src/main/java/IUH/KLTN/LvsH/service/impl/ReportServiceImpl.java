package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.*;
import IUH.KLTN.LvsH.entity.Product;
import IUH.KLTN.LvsH.repository.*;
import IUH.KLTN.LvsH.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ProductRepository productRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final OrderItemRepository orderItemRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CurrentInventoryReportDTO> getCurrentInventory(Long warehouseId) {
        if (warehouseId == null) {
            throw new RuntimeException("warehouseId is required");
        }

        return productRepository.findStockByWarehouseId(warehouseId)
                .stream()
                .map(item -> CurrentInventoryReportDTO.builder()
                        .productId(item.getId())
                        .sku(item.getSku())
                        .barcode(item.getBarcode())
                        .name(item.getName())
                        .shortName(item.getShortName())
                        .categoryId(item.getCategoryId())
                        .salePrice(item.getSalePrice())
                        .avgCost(item.getAvgCost())
                        .onHand(item.getOnHand())
                        .imageUrl(item.getImageUrl())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LowStockAlertReportDTO> getLowStockAlerts(Long warehouseId, Integer threshold) {
        if (warehouseId == null) {
            throw new RuntimeException("warehouseId is required");
        }
        int safeThreshold = threshold == null ? 10 : threshold;
        if (safeThreshold < 0) {
            throw new RuntimeException("threshold must be >= 0");
        }

        return productRepository.findLowStockByWarehouseId(warehouseId, safeThreshold)
                .stream()
                .map(item -> LowStockAlertReportDTO.builder()
                        .warehouseId(item.getWarehouseId())
                        .productId(item.getProductId())
                        .sku(item.getSku())
                        .productName(item.getProductName())
                        .onHand(item.getOnHand())
                        .threshold(safeThreshold)
                        .shortageQty(Math.max(0, safeThreshold - item.getOnHand()))
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockMovementPeriodReportDTO> getStockMovementByPeriod(Long warehouseId, LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);

        LocalDateTime fromTime = fromDate.atStartOfDay();
        LocalDateTime toTime = toDate.plusDays(1).atStartOfDay();

        return inventoryMovementRepository.getStockMovementByPeriod(warehouseId, fromTime, toTime)
                .stream()
                .map(item -> StockMovementPeriodReportDTO.builder()
                        .warehouseId(item.getWarehouseId())
                        .productId(item.getProductId())
                        .productSku(item.getProductSku())
                        .productName(item.getProductName())
                        .openingQty(item.getOpeningQty())
                        .inQty(item.getInQty())
                        .outQty(item.getOutQty())
                        .closingQty(item.getClosingQty())
                        .build())
                .toList();
    }

            @Override
            @Transactional(readOnly = true)
            public List<StockAdjustmentSummaryReportDTO> getStockAdjustmentSummary(Long warehouseId, LocalDate fromDate, LocalDate toDate) {
            validateDateRange(fromDate, toDate);

            return stockAdjustmentRepository.getStockAdjustmentSummary(warehouseId, fromDate, toDate)
                .stream()
                .map(item -> StockAdjustmentSummaryReportDTO.builder()
                    .adjustmentId(item.getAdjustmentId())
                    .adjustNo(item.getAdjustNo())
                    .adjustDate(item.getAdjustDate())
                    .warehouseId(item.getWarehouseId())
                    .warehouseName(item.getWarehouseName())
                    .reason(item.getReason())
                    .status(item.getStatus())
                    .totalIncreaseQty(item.getTotalIncreaseQty())
                    .totalDecreaseQty(item.getTotalDecreaseQty())
                    .netDiffQty(item.getNetDiffQty())
                    .estimatedValueImpact(item.getEstimatedValueImpact())
                    .build())
                .toList();
            }

    @Override
    @Transactional(readOnly = true)
    public List<DailyRevenueProfitReportDTO> getDailyRevenueProfit(Long warehouseId, LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);

        LocalDateTime fromTime = fromDate.atStartOfDay();
        LocalDateTime toTime = toDate.plusDays(1).atStartOfDay();

        return orderItemRepository.getDailyRevenueProfit(warehouseId, fromTime, toTime)
                .stream()
                .map(item -> DailyRevenueProfitReportDTO.builder()
                        .reportDate(item.getReportDate())
                        .ordersCount(item.getOrdersCount())
                        .revenue(item.getRevenue())
                        .profit(item.getProfit())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopSellingProductReportDTO> getTopSellingProducts(Long warehouseId, LocalDate fromDate, LocalDate toDate, Integer topN) {
        validateDateRange(fromDate, toDate);

        int safeTopN = topN == null ? 10 : topN;
        if (safeTopN <= 0) {
            throw new RuntimeException("topN must be greater than 0");
        }

        LocalDateTime fromTime = fromDate.atStartOfDay();
        LocalDateTime toTime = toDate.plusDays(1).atStartOfDay();

        return orderItemRepository.getTopSellingProducts(warehouseId, fromTime, toTime, safeTopN)
                .stream()
                .map(item -> TopSellingProductReportDTO.builder()
                        .productId(item.getProductId())
                        .sku(item.getSku())
                        .productName(item.getProductName())
                        .soldQty(item.getSoldQty())
                        .revenue(item.getRevenue())
                        .profit(item.getProfit())
                        .build())
                .toList();
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null || toDate == null) {
            throw new RuntimeException("fromDate and toDate are required");
        }
        if (toDate.isBefore(fromDate)) {
            throw new RuntimeException("toDate must be greater than or equal to fromDate");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryValueReportDTO> getInventoryValue(Long warehouseId) {
        if (warehouseId == null) {
            throw new RuntimeException("warehouseId is required");
        }

        List<Product> products = productRepository.findByDeletedAtIsNull();
        List<InventoryValueReportDTO> result = new ArrayList<>();

        for (Product product : products) {
            Integer onHand = productRepository.calculateOnHandByWarehouseAndProductId(warehouseId, product.getId());
            if (onHand == null || onHand == 0) {
                continue; // bỏ qua sản phẩm không có tồn
            }

            BigDecimal avgCost = product.getAvgCost() != null ? product.getAvgCost() : BigDecimal.ZERO;
            BigDecimal totalValue = avgCost.multiply(BigDecimal.valueOf(onHand));

            result.add(InventoryValueReportDTO.builder()
                    .warehouseId(warehouseId)
                    .productId(product.getId())
                    .sku(product.getSku())
                    .productName(product.getName())
                    .onHand(onHand)
                    .avgCost(avgCost)
                    .totalValue(totalValue)
                    .category(product.getCategory() != null ? product.getCategory().getName() : "")
                    .build());
        }

        return result.stream()
                .sorted((a, b) -> b.getTotalValue().compareTo(a.getTotalValue()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DaysOfCoverageReportDTO> getDaysOfCoverage(Long warehouseId, Integer analysisDays) {
        if (warehouseId == null) {
            throw new RuntimeException("warehouseId is required");
        }

        int safeDays = analysisDays == null ? 30 : analysisDays;
        if (safeDays <= 0) {
            throw new RuntimeException("analysisDays must be greater than 0");
        }

        LocalDate fromDate = LocalDate.now().minusDays(safeDays);
        LocalDate toDate = LocalDate.now();
        LocalDateTime fromTime = fromDate.atStartOfDay();
        LocalDateTime toTime = toDate.plusDays(1).atStartOfDay();

        // Lấy dữ liệu bán hàng
        List<Product> products = productRepository.findByDeletedAtIsNull();
        List<DaysOfCoverageReportDTO> result = new ArrayList<>();

        for (Product product : products) {
            Integer onHand = productRepository.calculateOnHandByWarehouseAndProductId(warehouseId, product.getId());
            if (onHand == null) onHand = 0;

            // Tính nhu cầu bình quân ngày
            long totalSoldQty = orderItemRepository.sumQtyOrderedInPeriod(warehouseId, product.getId(), fromTime, toTime);
            BigDecimal avgDailyDemand = BigDecimal.valueOf(totalSoldQty)
                    .divide(BigDecimal.valueOf(safeDays), 2, RoundingMode.HALF_UP);

            int daysOfCoverage = 999; // mặc định: vô tận nếu không bán
            if (avgDailyDemand.compareTo(BigDecimal.ZERO) > 0) {
                daysOfCoverage = BigDecimal.valueOf(onHand)
                        .divide(avgDailyDemand, 0, RoundingMode.HALF_UP)
                        .intValue();
            }

            String riskLevel = "SAFE";
            if (daysOfCoverage < 3) {
                riskLevel = "CRITICAL";
            } else if (daysOfCoverage < 7) {
                riskLevel = "WARNING";
            }

            if (avgDailyDemand.compareTo(BigDecimal.ZERO) > 0 || onHand > 0) {
                result.add(DaysOfCoverageReportDTO.builder()
                        .warehouseId(warehouseId)
                        .productId(product.getId())
                        .sku(product.getSku())
                        .productName(product.getName())
                        .onHand(onHand)
                        .avgDailyDemand(avgDailyDemand)
                        .daysOfCoverage(daysOfCoverage)
                        .riskLevel(riskLevel)
                        .build());
            }
        }

        return result.stream()
                .sorted(Comparator.comparingInt(DaysOfCoverageReportDTO::getDaysOfCoverage))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockoutRiskReportDTO> getStockoutRisk(Long warehouseId, Integer analysisDays) {
        if (warehouseId == null) {
            throw new RuntimeException("warehouseId is required");
        }

        int safeDays = analysisDays == null ? 30 : analysisDays;
        LocalDate fromDate = LocalDate.now().minusDays(safeDays);
        LocalDate toDate = LocalDate.now();
        LocalDateTime fromTime = fromDate.atStartOfDay();
        LocalDateTime toTime = toDate.plusDays(1).atStartOfDay();

        List<Product> products = productRepository.findByDeletedAtIsNull();
        List<StockoutRiskReportDTO> result = new ArrayList<>();

        for (Product product : products) {
            Integer onHand = productRepository.calculateOnHandByWarehouseAndProductId(warehouseId, product.getId());
            if (onHand == null) onHand = 0;

            long totalSoldQty = orderItemRepository.sumQtyOrderedInPeriod(warehouseId, product.getId(), fromTime, toTime);
            BigDecimal avgDailyDemand = BigDecimal.valueOf(totalSoldQty)
                    .divide(BigDecimal.valueOf(safeDays), 2, RoundingMode.HALF_UP);

            int daysUntilStockout = 999;
            LocalDate estimatedStockoutDate = null;
            String priority = "SAFE";

            if (avgDailyDemand.compareTo(BigDecimal.ZERO) > 0) {
                daysUntilStockout = BigDecimal.valueOf(onHand)
                        .divide(avgDailyDemand, 0, RoundingMode.HALF_UP)
                        .intValue();
                estimatedStockoutDate = LocalDate.now().plusDays(daysUntilStockout);

                if (daysUntilStockout < 2) {
                    priority = "CRITICAL";
                } else if (daysUntilStockout < 5) {
                    priority = "HIGH";
                } else if (daysUntilStockout < 14) {
                    priority = "MEDIUM";
                }
            }

            if (avgDailyDemand.compareTo(BigDecimal.ZERO) > 0 && !priority.equals("SAFE")) {
                result.add(StockoutRiskReportDTO.builder()
                        .warehouseId(warehouseId)
                        .productId(product.getId())
                        .sku(product.getSku())
                        .productName(product.getName())
                        .onHand(onHand)
                        .avgDailyDemand(avgDailyDemand)
                        .daysUntilStockout(daysUntilStockout)
                        .estimatedStockoutDate(estimatedStockoutDate)
                        .priority(priority)
                        .build());
            }
        }

        return result.stream()
                .sorted(Comparator.comparingInt(StockoutRiskReportDTO::getDaysUntilStockout))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SlowMovingProductReportDTO> getSlowMovingProducts(Long warehouseId, Integer inactiveDays) {
        if (warehouseId == null) {
            throw new RuntimeException("warehouseId is required");
        }

        int safeInactiveDays = inactiveDays == null ? 30 : inactiveDays;
        if (safeInactiveDays <= 0) {
            throw new RuntimeException("inactiveDays must be greater than 0");
        }

        LocalDate cutoffDate = LocalDate.now().minusDays(safeInactiveDays);
        LocalDateTime cutoffDateTime = cutoffDate.atStartOfDay();

        List<Product> products = productRepository.findByDeletedAtIsNull();
        List<SlowMovingProductReportDTO> result = new ArrayList<>();

        for (Product product : products) {
            Integer onHand = productRepository.calculateOnHandByWarehouseAndProductId(warehouseId, product.getId());
            if (onHand == null || onHand == 0) continue;

            LocalDateTime lastMovementTime = orderItemRepository.getLastOrderItemMovementTime(warehouseId, product.getId());
            if (lastMovementTime == null) {
                lastMovementTime = product.getCreatedAt();
            }

            LocalDate lastMovementDate = lastMovementTime.toLocalDate();
            long daysSinceLastMovement = java.time.temporal.ChronoUnit.DAYS.between(lastMovementDate, LocalDate.now());

            if (daysSinceLastMovement >= safeInactiveDays) {
                BigDecimal inventoryValue = product.getAvgCost().multiply(BigDecimal.valueOf(onHand));
                String riskCategory = "NORMAL";
                if (daysSinceLastMovement > 90) {
                    riskCategory = "DEAD_STOCK";
                } else if (daysSinceLastMovement >= 30) {
                    riskCategory = "SLOW_MOVING";
                }

                result.add(SlowMovingProductReportDTO.builder()
                        .warehouseId(warehouseId)
                        .productId(product.getId())
                        .sku(product.getSku())
                        .productName(product.getName())
                        .onHand(onHand)
                        .inventoryValue(inventoryValue)
                        .daysSinceLastMovement((int) daysSinceLastMovement)
                        .lastMovementDate(lastMovementDate)
                        .riskCategory(riskCategory)
                        .build());
            }
        }

        return result.stream()
                .sorted(Comparator.comparingInt(SlowMovingProductReportDTO::getDaysSinceLastMovement).reversed())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CurrentInventoryWarehouseReportDTO> getCurrentInventoryDetail(Long warehouseId) {
        if (warehouseId == null) {
            throw new RuntimeException("warehouseId is required");
        }

        List<Product> products = productRepository.findByDeletedAtIsNull();
        List<CurrentInventoryWarehouseReportDTO> result = new ArrayList<>();

        for (Product product : products) {
            Integer onHand = productRepository.calculateOnHandByWarehouseAndProductId(warehouseId, product.getId());
            if (onHand == null) onHand = 0;

            BigDecimal totalValue = product.getAvgCost().multiply(BigDecimal.valueOf(onHand));
            String status = onHand == 0 ? "OUT_OF_STOCK" : (onHand < 10 ? "LOW_STOCK" : "IN_STOCK");

            result.add(CurrentInventoryWarehouseReportDTO.builder()
                    .warehouseId(warehouseId)
                    .productId(product.getId())
                    .sku(product.getSku())
                    .productName(product.getName())
                    .categoryName(product.getCategory() != null ? product.getCategory().getName() : "")
                    .onHand(onHand)
                    .avgCost(product.getAvgCost())
                    .salePrice(product.getSalePrice())
                    .totalValue(totalValue)
                    .status(status)
                    .build());
        }

        return result.stream()
                .sorted(Comparator.comparing(CurrentInventoryWarehouseReportDTO::getStatus)
                        .thenComparingInt((a) -> a.getOnHand()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryTurnoverReportDTO> getInventoryTurnover(Long warehouseId, LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);

        LocalDateTime fromTime = fromDate.atStartOfDay();
        LocalDateTime toTime = toDate.plusDays(1).atStartOfDay();
        long daysDifference = java.time.temporal.ChronoUnit.DAYS.between(fromDate, toDate);
        if (daysDifference == 0) daysDifference = 1;

        List<Product> products = productRepository.findByDeletedAtIsNull();
        List<InventoryTurnoverReportDTO> result = new ArrayList<>();

        for (Product product : products) {
            long totalSoldQty = orderItemRepository.sumQtyOrderedInPeriod(warehouseId, product.getId(), fromTime, toTime);
            if (totalSoldQty == 0) continue;

            BigDecimal totalRevenue = orderItemRepository.sumLineRevenueInPeriod(warehouseId, product.getId(), fromTime, toTime);
            if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

            BigDecimal totalCogs = orderItemRepository.sumLineCOGSInPeriod(warehouseId, product.getId(), fromTime, toTime);
            if (totalCogs == null) totalCogs = BigDecimal.ZERO;

            // Tồn bình quân
            Integer startInventory = productRepository.calculateOnHandByWarehouseAndProductId(warehouseId, product.getId());
            if (startInventory == null) startInventory = 0;

            int avgInventoryQty = startInventory + (int) (totalSoldQty / 2); // đơn giản hóa
            BigDecimal avgInventoryValue = product.getAvgCost().multiply(BigDecimal.valueOf(avgInventoryQty));

            BigDecimal turnoverRatio = avgInventoryValue.compareTo(BigDecimal.ZERO) > 0
                    ? totalCogs.divide(avgInventoryValue, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            BigDecimal daysInventoryOutstanding = turnoverRatio.compareTo(BigDecimal.ZERO) > 0
                    ? BigDecimal.valueOf(365).divide(turnoverRatio, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            result.add(InventoryTurnoverReportDTO.builder()
                    .warehouseId(warehouseId)
                    .productId(product.getId())
                    .sku(product.getSku())
                    .productName(product.getName())
                    .quantitySold((int) totalSoldQty)
                    .revenue(totalRevenue)
                    .cogs(totalCogs)
                    .avgInventoryQty(avgInventoryQty)
                    .avgInventoryValue(avgInventoryValue)
                    .turnoverRatio(turnoverRatio)
                    .daysInventoryOutstanding(daysInventoryOutstanding)
                    .build());
        }

        return result.stream()
                .sorted(Comparator.comparing(InventoryTurnoverReportDTO::getTurnoverRatio).reversed())
                .toList();
    }
}
