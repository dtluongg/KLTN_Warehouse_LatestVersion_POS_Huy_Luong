package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.SalesSummaryReportDTO;
import java.time.LocalDateTime;

public interface SalesReportService {
    SalesSummaryReportDTO getSalesSummaryReport(Long warehouseId, LocalDateTime fromDate, LocalDateTime toDate);
}
