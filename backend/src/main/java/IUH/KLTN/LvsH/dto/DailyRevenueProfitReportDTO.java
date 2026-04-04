package IUH.KLTN.LvsH.dto;

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
