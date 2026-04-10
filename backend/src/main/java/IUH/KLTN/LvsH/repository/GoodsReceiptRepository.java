package IUH.KLTN.LvsH.repository;

import IUH.KLTN.LvsH.entity.GoodsReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Long>, JpaSpecificationExecutor<GoodsReceipt> {
    @Query("SELECT g.grNo FROM GoodsReceipt g WHERE g.id = :id")
    String findGrNoById(@Param("id") Long id);
}
