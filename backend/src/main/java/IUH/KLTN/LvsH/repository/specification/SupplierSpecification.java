package IUH.KLTN.LvsH.repository.specification;

import IUH.KLTN.LvsH.dto.supplier.SupplierSearchCriteria;
import IUH.KLTN.LvsH.entity.Supplier;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class SupplierSpecification {
    public static Specification<Supplier> withCriteria(SupplierSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                String kw = "%" + criteria.getKeyword().toLowerCase() + "%";
                Predicate defaultMatch = cb.or(
                        cb.like(cb.lower(root.get("supplierCode")), kw),
                        cb.like(cb.lower(root.get("name")), kw),
                        cb.like(cb.lower(root.get("phone")), kw)
                );
                predicates.add(defaultMatch);
            }
            if (criteria.getIsActive() != null) {
                predicates.add(cb.equal(root.get("isActive"), criteria.getIsActive()));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
