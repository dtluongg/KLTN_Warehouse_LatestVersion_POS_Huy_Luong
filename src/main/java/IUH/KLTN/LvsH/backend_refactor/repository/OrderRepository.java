package IUH.KLTN.LvsH.backend_refactor.repository;

import IUH.KLTN.LvsH.backend_refactor.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o.orderNo FROM Order o WHERE o.id = :id")
    String findOrderNoById(@Param("id") Long id);
}
