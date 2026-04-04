package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.entity.Coupon;
import java.util.List;

public interface CouponService {
    List<Coupon> getAllCoupons();
    Coupon getCouponById(Long id);
    Coupon createCoupon(Coupon coupon);
    Coupon updateCoupon(Long id, Coupon coupon);
    void deleteCoupon(Long id);
}
