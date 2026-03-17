package com.pos.service;

import com.pos.dto.CreatePurchaseOrderDto;
import com.pos.entity.PurchaseOrder;

import java.util.List;

public interface PurchaseOrderService {
    List<PurchaseOrder> getAllPurchaseOrders();
    PurchaseOrder getPurchaseOrderById(Long id);
    PurchaseOrder createPurchaseOrder(CreatePurchaseOrderDto dto);
    PurchaseOrder updateStatus(Long id, String newStatus);
}
