package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeAndDeletedAtIsNull(String code);
    List<Coupon> findByDeletedAtIsNull();

    Optional<Coupon> findByIdAndDeletedAtIsNull(Long id);
}
