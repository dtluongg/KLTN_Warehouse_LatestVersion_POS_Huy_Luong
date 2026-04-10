package IUH.KLTN.LvsH.repository.specification;

import IUH.KLTN.LvsH.dto.warehouse.WarehouseSearchCriteria;
import IUH.KLTN.LvsH.entity.Warehouse;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class WarehouseSpecification {
    public static Specification<Warehouse> withCriteria(WarehouseSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                String kw = "%" + criteria.getKeyword().toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("code")), kw);
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), kw);
                Predicate addressMatch = cb.like(cb.lower(root.get("address")), kw);
                predicates.add(cb.or(codeMatch, nameMatch, addressMatch));
            }
            if (criteria.getIsActive() != null) {
                predicates.add(cb.equal(root.get("isActive"), criteria.getIsActive()));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
