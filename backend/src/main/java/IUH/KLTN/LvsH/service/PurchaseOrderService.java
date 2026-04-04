package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.PurchaseOrderRequestDTO;
import IUH.KLTN.LvsH.dto.PurchaseOrderResponseDTO;
import IUH.KLTN.LvsH.entity.PurchaseOrder;

import java.util.List;

public interface PurchaseOrderService {
    List<PurchaseOrder> getAllPurchaseOrders();
    PurchaseOrder getPurchaseOrderById(Long id);
    PurchaseOrderResponseDTO createPurchaseOrder(PurchaseOrderRequestDTO dto);
    PurchaseOrderResponseDTO updateDraftPurchaseOrder(Long id, PurchaseOrderRequestDTO dto);
    PurchaseOrderResponseDTO updateStatus(Long id, String newStatus);
}
