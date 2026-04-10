package IUH.KLTN.LvsH.repository.specification;

import IUH.KLTN.LvsH.dto.customer.CustomerSearchCriteria;
import IUH.KLTN.LvsH.entity.Customer;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class CustomerSpecification {
    public static Specification<Customer> withCriteria(CustomerSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                String kw = "%" + criteria.getKeyword().toLowerCase() + "%";
                Predicate defaultMatch = cb.or(
                        cb.like(cb.lower(root.get("customerCode")), kw),
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
