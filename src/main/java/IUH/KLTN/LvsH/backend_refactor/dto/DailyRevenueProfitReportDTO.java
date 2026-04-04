package IUH.KLTN.LvsH.backend_refactor.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;

@Value
@Builder
public class DailyRevenueProfitReportDTO {
    LocalDate reportDate;
    Long ordersCount;
    BigDecimal revenue;
    BigDecimal profit;
}
