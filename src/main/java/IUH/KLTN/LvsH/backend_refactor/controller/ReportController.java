package IUH.KLTN.LvsH.backend_refactor.controller;

import IUH.KLTN.LvsH.backend_refactor.dto.CurrentInventoryReportDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.DailyRevenueProfitReportDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.StockMovementPeriodReportDTO;
import IUH.KLTN.LvsH.backend_refactor.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/current-inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<List<CurrentInventoryReportDTO>> getCurrentInventory(@RequestParam Long warehouseId) {
        return ResponseEntity.ok(reportService.getCurrentInventory(warehouseId));
    }

    @GetMapping("/stock-movement")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_STAFF')")
    public ResponseEntity<List<StockMovementPeriodReportDTO>> getStockMovementByPeriod(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(reportService.getStockMovementByPeriod(warehouseId, fromDate, toDate));
    }

    @GetMapping("/daily-revenue-profit")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<List<DailyRevenueProfitReportDTO>> getDailyRevenueProfit(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        return ResponseEntity.ok(reportService.getDailyRevenueProfit(warehouseId, fromDate, toDate));
    }
}
