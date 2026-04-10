package IUH.KLTN.LvsH.dto.coupon;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CouponRequestDTO {
    @NotBlank(message = "Vui lòng nhập mã mã giảm giá")
    private String code;
    
    @NotBlank(message = "Vui lòng loại giảm giá (PERCENT / FIXED)")
    private String discountType;
    
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private Integer usageLimit;
    private Boolean isActive;
}
