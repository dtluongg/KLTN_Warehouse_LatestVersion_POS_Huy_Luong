package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.StockAdjustmentRequestDTO;
import IUH.KLTN.LvsH.entity.StockAdjustment;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.repository.InventoryMovementRepository;
import IUH.KLTN.LvsH.repository.ProductRepository;
import IUH.KLTN.LvsH.repository.StaffRepository;
import IUH.KLTN.LvsH.repository.StockAdjustmentItemRepository;
import IUH.KLTN.LvsH.repository.StockAdjustmentRepository;
import IUH.KLTN.LvsH.repository.WarehouseRepository;
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
