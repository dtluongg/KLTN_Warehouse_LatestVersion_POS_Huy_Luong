package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.SupplierReturnRequestDTO;
import IUH.KLTN.LvsH.entity.SupplierReturn;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.repository.GoodsReceiptItemRepository;
import IUH.KLTN.LvsH.repository.GoodsReceiptRepository;
import IUH.KLTN.LvsH.repository.InventoryMovementRepository;
import IUH.KLTN.LvsH.repository.ProductRepository;
import IUH.KLTN.LvsH.repository.StaffRepository;
import IUH.KLTN.LvsH.repository.SupplierRepository;
import IUH.KLTN.LvsH.repository.SupplierReturnItemRepository;
import IUH.KLTN.LvsH.repository.SupplierReturnRepository;
import IUH.KLTN.LvsH.repository.WarehouseRepository;
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
class SupplierReturnServiceImplTest {

    @Mock
    private SupplierReturnRepository srRepository;
    @Mock
    private SupplierReturnItemRepository srItemRepository;
    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private GoodsReceiptRepository grRepository;
    @Mock
    private GoodsReceiptItemRepository grItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private StaffRepository staffRepository;
    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private InventoryMovementRepository movementRepository;

    @InjectMocks
    private SupplierReturnServiceImpl service;

    @Test
    void updateDraftSupplierReturn_shouldRejectWhenNotDraft() {
        SupplierReturnRequestDTO dto = new SupplierReturnRequestDTO();
        SupplierReturnRequestDTO.ReturnItemRequestDTO item = new SupplierReturnRequestDTO.ReturnItemRequestDTO();
        item.setProductId(1L);
        item.setQty(1);
        item.setReturnAmount(BigDecimal.ONE);
        dto.setItems(List.of(item));

        SupplierReturn sr = SupplierReturn.builder().id(1L).status(DocumentStatus.POSTED).build();
        when(srRepository.findById(1L)).thenReturn(Optional.of(sr));

        assertThrows(RuntimeException.class, () -> service.updateDraftSupplierReturn(1L, dto));
    }

    @Test
    void completeSupplierReturn_shouldRejectWhenCancelled() {
        SupplierReturn sr = SupplierReturn.builder().id(1L).status(DocumentStatus.CANCELLED).build();
        when(srRepository.findById(1L)).thenReturn(Optional.of(sr));

        assertThrows(RuntimeException.class, () -> service.completeSupplierReturn(1L));
    }
}
