package IUH.KLTN.LvsH.dto.coupon;

import lombok.Data;

@Data
public class CouponSearchCriteria {
    private String keyword; 
    private String discountType;
    private Boolean isActive;
}
