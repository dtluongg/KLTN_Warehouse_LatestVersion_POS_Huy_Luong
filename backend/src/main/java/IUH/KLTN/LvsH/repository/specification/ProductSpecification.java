package IUH.KLTN.LvsH.repository.specification;

import IUH.KLTN.LvsH.dto.product.ProductSearchCriteria;
import IUH.KLTN.LvsH.entity.Product;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {
    public static Specification<Product> withCriteria(ProductSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                String kw = "%" + criteria.getKeyword().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), kw);
                Predicate skuMatch = cb.like(cb.lower(root.get("sku")), kw);
                Predicate barcodeMatch = cb.like(cb.lower(root.get("barcode")), kw);
                predicates.add(cb.or(nameMatch, skuMatch, barcodeMatch));
            }
            if (criteria.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), criteria.getCategoryId()));
            }
            if (criteria.getIsActive() != null) {
                predicates.add(cb.equal(root.get("isActive"), criteria.getIsActive()));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
