package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.coupon.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CouponService {
    Page<CouponResponseDTO> getAllCoupons(CouponSearchCriteria criteria, Pageable pageable);
    CouponResponseDTO getCouponDetailById(Long id);
    CouponResponseDTO createCoupon(CouponRequestDTO request);
    CouponResponseDTO updateCoupon(Long id, CouponRequestDTO request);
    void deleteCoupon(Long id);
}
