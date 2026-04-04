package IUH.KLTN.LvsH.backend_refactor.service.impl;

import IUH.KLTN.LvsH.backend_refactor.dto.CurrentInventoryReportDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.DailyRevenueProfitReportDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.StockMovementPeriodReportDTO;
import IUH.KLTN.LvsH.backend_refactor.repository.InventoryMovementRepository;
import IUH.KLTN.LvsH.backend_refactor.repository.OrderItemRepository;
import IUH.KLTN.LvsH.backend_refactor.repository.ProductRepository;
import IUH.KLTN.LvsH.backend_refactor.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ProductRepository productRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final OrderItemRepository orderItemRepository;

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

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null || toDate == null) {
            throw new RuntimeException("fromDate and toDate are required");
        }
        if (toDate.isBefore(fromDate)) {
            throw new RuntimeException("toDate must be greater than or equal to fromDate");
        }
    }
}
