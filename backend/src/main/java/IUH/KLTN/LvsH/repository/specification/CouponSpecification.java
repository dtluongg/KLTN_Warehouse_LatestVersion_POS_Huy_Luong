package IUH.KLTN.LvsH.repository.specification;

import IUH.KLTN.LvsH.dto.coupon.CouponSearchCriteria;
import IUH.KLTN.LvsH.entity.Coupon;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class CouponSpecification {
    public static Specification<Coupon> withCriteria(CouponSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                String kw = "%" + criteria.getKeyword().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("code")), kw));
            }
            if (criteria.getDiscountType() != null && !criteria.getDiscountType().isBlank()) {
                predicates.add(cb.equal(root.get("discountType"), criteria.getDiscountType()));
            }
            if (criteria.getIsActive() != null) {
                predicates.add(cb.equal(root.get("isActive"), criteria.getIsActive()));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
