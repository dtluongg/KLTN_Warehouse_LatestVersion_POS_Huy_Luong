package com.pos.service.impl;

import com.pos.dto.PurchaseOrderRequestDTO;
import com.pos.entity.PurchaseOrder;
import com.pos.enums.DocumentStatus;
import com.pos.repository.ProductRepository;
import com.pos.repository.PurchaseOrderItemRepository;
import com.pos.repository.PurchaseOrderRepository;
import com.pos.repository.StaffRepository;
import com.pos.repository.SupplierRepository;
import com.pos.repository.WarehouseRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PurchaseOrderServiceImplTest {

    @Mock
    private PurchaseOrderRepository poRepository;
    @Mock
    private PurchaseOrderItemRepository poItemRepository;
    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private StaffRepository staffRepository;
    @Mock
    private WarehouseRepository warehouseRepository;

    @InjectMocks
    private PurchaseOrderServiceImpl service;

    @Test
    void updateDraftPurchaseOrder_shouldRejectWhenNotDraft() {
        PurchaseOrderRequestDTO dto = new PurchaseOrderRequestDTO();
        PurchaseOrderRequestDTO.PoItemRequestDTO item = new PurchaseOrderRequestDTO.PoItemRequestDTO();
        item.setProductId(1L);
        item.setOrderedQty(1);
        item.setExpectedUnitCost(BigDecimal.ONE);
        dto.setItems(List.of(item));

        PurchaseOrder po = PurchaseOrder.builder().id(1L).status(DocumentStatus.POSTED).build();
        when(poRepository.findById(1L)).thenReturn(Optional.of(po));

        assertThrows(RuntimeException.class, () -> service.updateDraftPurchaseOrder(1L, dto));
    }

    @Test
    void updateStatus_shouldRejectWhenCurrentStatusIsPosted() {
        PurchaseOrder po = PurchaseOrder.builder().id(1L).status(DocumentStatus.POSTED).build();
        when(poRepository.findById(1L)).thenReturn(Optional.of(po));

        assertThrows(RuntimeException.class, () -> service.updateStatus(1L, "CANCELLED"));
    }
}
