package IUH.KLTN.LvsH.repository.specification;

import IUH.KLTN.LvsH.dto.order.OrderSearchCriteria;
import IUH.KLTN.LvsH.entity.Order;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.enums.SalesChannel;
import IUH.KLTN.LvsH.enums.PaymentMethod;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class OrderSpecification {
    public static Specification<Order> withCriteria(OrderSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getKeyword() != null && !criteria.getKeyword().isBlank()) {
                String kw = "%" + criteria.getKeyword().toLowerCase() + "%";
                Predicate defaultMatch = cb.or(
                        cb.like(cb.lower(root.get("orderNo")), kw),
                        cb.like(cb.lower(root.join("customer").get("name")), kw)
                );
                predicates.add(defaultMatch);
            }
            if (criteria.getCustomerId() != null && !criteria.getCustomerId().isBlank()) {
                predicates.add(cb.equal(root.get("customer").get("id"), java.util.UUID.fromString(criteria.getCustomerId())));
            }
            if (criteria.getStatus() != null && !criteria.getStatus().isBlank()) {
                predicates.add(cb.equal(root.get("status"), DocumentStatus.valueOf(criteria.getStatus())));
            }
            if (criteria.getSalesChannel() != null && !criteria.getSalesChannel().isBlank()) {
                predicates.add(cb.equal(root.get("salesChannel"), SalesChannel.valueOf(criteria.getSalesChannel())));
            }
            if (criteria.getPaymentMethod() != null && !criteria.getPaymentMethod().isBlank()) {
                predicates.add(cb.equal(root.get("paymentMethod"), PaymentMethod.valueOf(criteria.getPaymentMethod())));
            }
            if (criteria.getWarehouseId() != null) {
                predicates.add(cb.equal(root.get("warehouse").get("id"), criteria.getWarehouseId()));
            }
            if (criteria.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("orderTime"), criteria.getFromDate()));
            }
            if (criteria.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("orderTime"), criteria.getToDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
