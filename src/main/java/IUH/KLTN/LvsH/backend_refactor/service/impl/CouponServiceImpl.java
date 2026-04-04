package IUH.KLTN.LvsH.backend_refactor.service.impl;

import IUH.KLTN.LvsH.backend_refactor.entity.Coupon;
import IUH.KLTN.LvsH.backend_refactor.repository.CouponRepository;
import IUH.KLTN.LvsH.backend_refactor.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    @Override
    public List<Coupon> getAllCoupons() {
        return couponRepository.findByDeletedAtIsNull();
    }

    @Override
    public Coupon getCouponById(Long id) {
        return couponRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found: " + id));
    }

    @Override
    public Coupon createCoupon(Coupon coupon) {
        return couponRepository.save(coupon);
    }

    @Override
    public Coupon updateCoupon(Long id, Coupon couponDetails) {
        Coupon coupon = getCouponById(id);
        coupon.setCode(couponDetails.getCode());
        coupon.setDiscountType(couponDetails.getDiscountType());
        coupon.setDiscountValue(couponDetails.getDiscountValue());
        coupon.setMinOrderAmount(couponDetails.getMinOrderAmount());
        coupon.setMaxDiscountAmount(couponDetails.getMaxDiscountAmount());
        coupon.setStartsAt(couponDetails.getStartsAt());
        coupon.setEndsAt(couponDetails.getEndsAt());
        coupon.setUsageLimit(couponDetails.getUsageLimit());
        coupon.setIsActive(couponDetails.getIsActive());
        return couponRepository.save(coupon);
    }

    @Override
    public void deleteCoupon(Long id) {
        Coupon coupon = getCouponById(id);
        coupon.setDeletedAt(LocalDateTime.now());
        couponRepository.save(coupon);
    }
}
