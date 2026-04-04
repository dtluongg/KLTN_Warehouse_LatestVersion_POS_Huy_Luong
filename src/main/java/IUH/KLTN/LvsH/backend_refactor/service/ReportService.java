package IUH.KLTN.LvsH.backend_refactor.service;

import IUH.KLTN.LvsH.backend_refactor.dto.CurrentInventoryReportDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.DailyRevenueProfitReportDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.StockMovementPeriodReportDTO;

import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    List<CurrentInventoryReportDTO> getCurrentInventory(Long warehouseId);

    List<StockMovementPeriodReportDTO> getStockMovementByPeriod(Long warehouseId, LocalDate fromDate, LocalDate toDate);

    List<DailyRevenueProfitReportDTO> getDailyRevenueProfit(Long warehouseId, LocalDate fromDate, LocalDate toDate);
}
