package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    @Query("SELECT o.orderNo FROM Order o WHERE o.id = :id")
    String findOrderNoById(@Param("id") Long id);

    Optional<Order> findByPayosOrderCode(String payosOrderCode);
}
