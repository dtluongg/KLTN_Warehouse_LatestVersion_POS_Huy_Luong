package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.PurchaseOrder;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long>, JpaSpecificationExecutor<PurchaseOrder> {
    @Query("SELECT p.poNo FROM PurchaseOrder p WHERE p.id = :id")
    String findPoNoById(@Param("id") Long id);

    List<PurchaseOrder> findByStatus(DocumentStatus status);
}
