package IUH.KLTN.LvsH.repository.specification;

import IUH.KLTN.LvsH.dto.stock_adjustment.StockAdjustmentSearchCriteria;
import IUH.KLTN.LvsH.entity.StockAdjustment;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class StockAdjustmentSpecification {
    public static Specification<StockAdjustment> withCriteria(StockAdjustmentSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                String kw = "%" + criteria.getKeyword().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("adjustNo")), kw));
            }
            if (criteria.getWarehouseId() != null) {
                predicates.add(cb.equal(root.join("warehouse").get("id"), criteria.getWarehouseId()));
            }
            if (criteria.getStatus() != null && !criteria.getStatus().isBlank()) {
                predicates.add(cb.equal(root.get("status"), DocumentStatus.valueOf(criteria.getStatus())));
            }
            if (criteria.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("adjustDate"), criteria.getFromDate()));
            }
            if (criteria.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("adjustDate"), criteria.getToDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
