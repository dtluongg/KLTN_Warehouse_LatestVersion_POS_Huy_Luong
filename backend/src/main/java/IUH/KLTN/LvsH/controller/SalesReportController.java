package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.SalesSummaryReportDTO;
import IUH.KLTN.LvsH.service.SalesReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/sales-reports")
@RequiredArgsConstructor
public class SalesReportController {

    private final SalesReportService salesReportService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'WAREHOUSE_STAFF')")
    public ResponseEntity<SalesSummaryReportDTO> getSalesSummary(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {
        return ResponseEntity.ok(salesReportService.getSalesSummaryReport(warehouseId, fromDate, toDate));
    }
}
