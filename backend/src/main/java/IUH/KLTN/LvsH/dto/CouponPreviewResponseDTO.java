package IUH.KLTN.LvsH.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CouponPreviewResponseDTO {
    private String couponCode;
    private boolean valid;
    private BigDecimal grossAmount;
    private BigDecimal discountAmount;
    private BigDecimal payableAmount;
    private String message;
}
