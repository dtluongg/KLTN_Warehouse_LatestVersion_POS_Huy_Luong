package IUH.KLTN.LvsH.repository.specification;

import IUH.KLTN.LvsH.dto.inventory_movement.InventoryMovementSearchCriteria;
import IUH.KLTN.LvsH.entity.InventoryMovement;
import IUH.KLTN.LvsH.enums.InventoryMovementType;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class InventoryMovementSpecification {
    public static Specification<InventoryMovement> withCriteria(InventoryMovementSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                String kw = "%" + criteria.getKeyword().toLowerCase() + "%";
                Predicate defaultMatch = cb.or(
                        cb.like(cb.lower(root.join("product").get("name")), kw),
                        cb.like(cb.lower(root.join("product").get("sku")), kw),
                        cb.like(cb.lower(root.get("refId")), kw)
                );
                predicates.add(defaultMatch);
            }
            if (criteria.getWarehouseId() != null) {
                predicates.add(cb.equal(root.join("warehouse").get("id"), criteria.getWarehouseId()));
            }
            if (criteria.getMovementType() != null && !criteria.getMovementType().isBlank()) {
                predicates.add(cb.equal(root.get("movementType"), InventoryMovementType.valueOf(criteria.getMovementType())));
            }
            if (criteria.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), criteria.getFromDate()));
            }
            if (criteria.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), criteria.getToDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
