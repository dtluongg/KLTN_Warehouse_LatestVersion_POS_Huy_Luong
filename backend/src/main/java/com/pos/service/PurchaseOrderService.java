package com.pos.service;

import com.pos.dto.PurchaseOrderRequestDTO;
import com.pos.dto.PurchaseOrderResponseDTO;
import com.pos.entity.PurchaseOrder;

import java.util.List;

public interface PurchaseOrderService {
    List<PurchaseOrder> getAllPurchaseOrders();
    PurchaseOrder getPurchaseOrderById(Long id);
    PurchaseOrderResponseDTO createPurchaseOrder(PurchaseOrderRequestDTO dto);
    PurchaseOrderResponseDTO updateDraftPurchaseOrder(Long id, PurchaseOrderRequestDTO dto);
    PurchaseOrderResponseDTO updateStatus(Long id, String newStatus);
}
