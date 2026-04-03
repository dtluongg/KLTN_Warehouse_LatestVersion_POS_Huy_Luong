package com.pos.service.impl;

import com.pos.dto.StockAdjustmentRequestDTO;
import com.pos.entity.StockAdjustment;
import com.pos.enums.DocumentStatus;
import com.pos.repository.InventoryMovementRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.StaffRepository;
import com.pos.repository.StockAdjustmentItemRepository;
import com.pos.repository.StockAdjustmentRepository;
import com.pos.repository.WarehouseRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockAdjustmentServiceImplTest {

    @Mock
    private StockAdjustmentRepository adjustRepository;
    @Mock
    private StockAdjustmentItemRepository adjustItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private StaffRepository staffRepository;
    @Mock
    private InventoryMovementRepository movementRepository;

    @InjectMocks
    private StockAdjustmentServiceImpl service;

    @Test
    void updateDraftAdjustment_shouldRejectWhenNotDraft() {
        StockAdjustmentRequestDTO dto = new StockAdjustmentRequestDTO();
        StockAdjustmentRequestDTO.AdjustmentItemRequestDTO item = new StockAdjustmentRequestDTO.AdjustmentItemRequestDTO();
        item.setProductId(1L);
        item.setActualQty(1);
        dto.setItems(List.of(item));

        StockAdjustment adjust = StockAdjustment.builder().id(1L).status(DocumentStatus.POSTED).build();
        when(adjustRepository.findById(1L)).thenReturn(Optional.of(adjust));

        assertThrows(RuntimeException.class, () -> service.updateDraftAdjustment(1L, dto));
    }

    @Test
    void completeAdjustment_shouldRejectWhenCancelled() {
        StockAdjustment adjust = StockAdjustment.builder().id(1L).status(DocumentStatus.CANCELLED).build();
        when(adjustRepository.findById(1L)).thenReturn(Optional.of(adjust));

        assertThrows(RuntimeException.class, () -> service.completeAdjustment(1L));
    }
}
