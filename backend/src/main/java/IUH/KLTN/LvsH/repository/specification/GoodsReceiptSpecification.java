package IUH.KLTN.LvsH.repository.specification;

import IUH.KLTN.LvsH.dto.goods_receipt.GoodsReceiptSearchCriteria;
import IUH.KLTN.LvsH.entity.GoodsReceipt;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class GoodsReceiptSpecification {
    public static Specification<GoodsReceipt> withCriteria(GoodsReceiptSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                Predicate grNoMatch = cb.like(cb.lower(root.get("grNo")), "%" + criteria.getKeyword().toLowerCase() + "%");
                Predicate poNoMatch = cb.like(cb.lower(root.get("purchaseOrder").get("poNo")), "%" + criteria.getKeyword().toLowerCase() + "%");
                predicates.add(cb.or(grNoMatch, poNoMatch));
            }
            if (criteria.getSupplierId() != null && !criteria.getSupplierId().isBlank()) {
                predicates.add(cb.equal(root.get("supplier").get("id"), java.util.UUID.fromString(criteria.getSupplierId())));
            }
            if (criteria.getWarehouseId() != null) {
                predicates.add(cb.equal(root.get("warehouse").get("id"), criteria.getWarehouseId()));
            }
            if (criteria.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), criteria.getStatus()));
            }
            if (criteria.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("receiptDate"), criteria.getStartDate()));
            }
            if (criteria.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("receiptDate"), criteria.getEndDate()));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
