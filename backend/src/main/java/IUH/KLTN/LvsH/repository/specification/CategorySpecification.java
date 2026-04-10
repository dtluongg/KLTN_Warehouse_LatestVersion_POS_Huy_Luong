package IUH.KLTN.LvsH.repository.specification;

import IUH.KLTN.LvsH.dto.category.CategorySearchCriteria;
import IUH.KLTN.LvsH.entity.Category;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class CategorySpecification {
    public static Specification<Category> withCriteria(CategorySearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                String kw = "%" + criteria.getKeyword().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), kw);
                Predicate slugMatch = cb.like(cb.lower(root.get("slug")), kw);
                predicates.add(cb.or(nameMatch, slugMatch));
            }
            if (criteria.getIsActive() != null) {
                predicates.add(cb.equal(root.get("isActive"), criteria.getIsActive()));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
