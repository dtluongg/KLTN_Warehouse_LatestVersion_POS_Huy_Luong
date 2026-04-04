package IUH.KLTN.LvsH.backend_refactor.service;

import IUH.KLTN.LvsH.backend_refactor.dto.PurchaseOrderRequestDTO;
import IUH.KLTN.LvsH.backend_refactor.dto.PurchaseOrderResponseDTO;
import IUH.KLTN.LvsH.backend_refactor.entity.PurchaseOrder;

import java.util.List;

public interface PurchaseOrderService {
    List<PurchaseOrder> getAllPurchaseOrders();
    PurchaseOrder getPurchaseOrderById(Long id);
    PurchaseOrderResponseDTO createPurchaseOrder(PurchaseOrderRequestDTO dto);
    PurchaseOrderResponseDTO updateDraftPurchaseOrder(Long id, PurchaseOrderRequestDTO dto);
    PurchaseOrderResponseDTO updateStatus(Long id, String newStatus);
}
