package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.coupon.*;
import IUH.KLTN.LvsH.entity.Coupon;
import IUH.KLTN.LvsH.repository.CouponRepository;
import IUH.KLTN.LvsH.repository.specification.CouponSpecification;
import IUH.KLTN.LvsH.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    @Override
    public Page<CouponResponseDTO> getAllCoupons(CouponSearchCriteria criteria, Pageable pageable) {
        Page<Coupon> page = couponRepository.findAll(CouponSpecification.withCriteria(criteria), pageable);
        return page.map(this::toResponseDTO);
    }

    private Coupon getCouponById(Long id) {
        return couponRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found: " + id));
    }

    @Override
    public CouponResponseDTO getCouponDetailById(Long id) {
        return toResponseDTO(getCouponById(id));
    }

    @Override
    public CouponResponseDTO createCoupon(CouponRequestDTO request) {
        Coupon coupon = Coupon.builder()
                .code(request.getCode())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .usageLimit(request.getUsageLimit())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .usedCount(0)
                .build();
        return toResponseDTO(couponRepository.save(coupon));
    }

    @Override
    public CouponResponseDTO updateCoupon(Long id, CouponRequestDTO request) {
        Coupon coupon = getCouponById(id);
        coupon.setCode(request.getCode());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinOrderAmount(request.getMinOrderAmount());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setStartsAt(request.getStartsAt());
        coupon.setEndsAt(request.getEndsAt());
        coupon.setUsageLimit(request.getUsageLimit());
        if(request.getIsActive() != null) {
            coupon.setIsActive(request.getIsActive());
        }
        return toResponseDTO(couponRepository.save(coupon));
    }

    @Override
    public void deleteCoupon(Long id) {
        Coupon coupon = getCouponById(id);
        coupon.setDeletedAt(LocalDateTime.now());
        couponRepository.save(coupon);
    }

    private CouponResponseDTO toResponseDTO(Coupon coupon) {
        return CouponResponseDTO.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .minOrderAmount(coupon.getMinOrderAmount())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .startsAt(coupon.getStartsAt())
                .endsAt(coupon.getEndsAt())
                .usageLimit(coupon.getUsageLimit())
                .usedCount(coupon.getUsedCount())
                .isActive(coupon.getIsActive())
                .build();
    }
}
