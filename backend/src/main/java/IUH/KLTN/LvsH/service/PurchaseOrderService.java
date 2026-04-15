package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.purchase_order.*;
import IUH.KLTN.LvsH.enums.PurchaseOrderClosedReason;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PurchaseOrderService {
    Page<PurchaseOrderListResponseDTO> getAllPurchaseOrders(PurchaseOrderSearchCriteria criteria, Pageable pageable);
    PurchaseOrderDetailResponseDTO getPurchaseOrderDetailById(Long id);
    PurchaseOrderDetailResponseDTO createPurchaseOrder(PurchaseOrderRequestDTO request);
    PurchaseOrderDetailResponseDTO updateDraftPurchaseOrder(Long id, PurchaseOrderRequestDTO request);
    PurchaseOrderDetailResponseDTO updateStatus(Long id, String newStatus);
    PurchaseOrderDetailResponseDTO closePurchaseOrder(Long id, PurchaseOrderClosedReason reason);
}
