package IUH.KLTN.LvsH.repository.specification;

import IUH.KLTN.LvsH.dto.purchase_order.PurchaseOrderSearchCriteria;
import IUH.KLTN.LvsH.entity.PurchaseOrder;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class PurchaseOrderSpecification {
    public static Specification<PurchaseOrder> withCriteria(PurchaseOrderSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                String kw = "%" + criteria.getKeyword().toLowerCase() + "%";
                Predicate defaultMatch = cb.or(
                        cb.like(cb.lower(root.get("poNo")), kw),
                        cb.like(cb.lower(root.join("supplier").get("name")), kw)
                );
                predicates.add(defaultMatch);
            }
            if (criteria.getWarehouseId() != null) {
                predicates.add(cb.equal(root.join("warehouse").get("id"), criteria.getWarehouseId()));
            }
            if (criteria.getStatus() != null && !criteria.getStatus().isBlank()) {
                predicates.add(cb.equal(root.get("status"), DocumentStatus.valueOf(criteria.getStatus())));
            }
            if (criteria.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("orderDate"), criteria.getFromDate()));
            }
            if (criteria.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("orderDate"), criteria.getToDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
