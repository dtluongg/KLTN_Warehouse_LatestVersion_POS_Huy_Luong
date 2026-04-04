package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.GoodsReceiptRequestDTO;
import IUH.KLTN.LvsH.entity.GoodsReceipt;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.repository.GoodsReceiptItemRepository;
import IUH.KLTN.LvsH.repository.GoodsReceiptRepository;
import IUH.KLTN.LvsH.repository.InventoryMovementRepository;
import IUH.KLTN.LvsH.repository.ProductRepository;
import IUH.KLTN.LvsH.repository.PurchaseOrderItemRepository;
import IUH.KLTN.LvsH.repository.PurchaseOrderRepository;
import IUH.KLTN.LvsH.repository.StaffRepository;
import IUH.KLTN.LvsH.repository.SupplierRepository;
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
class GoodsReceiptServiceImplTest {

    @Mock
    private GoodsReceiptRepository grRepository;
    @Mock
    private GoodsReceiptItemRepository grItemRepository;
    @Mock
    private PurchaseOrderRepository poRepository;
    @Mock
    private PurchaseOrderItemRepository poItemRepository;
    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private StaffRepository staffRepository;
    @Mock
    private InventoryMovementRepository inventoryMovementRepository;

    @InjectMocks
    private GoodsReceiptServiceImpl service;

    @Test
    void updateDraftGoodsReceipt_shouldRejectWhenNotDraft() {
        GoodsReceiptRequestDTO dto = new GoodsReceiptRequestDTO();
        GoodsReceiptRequestDTO.GrItemRequestDTO item = new GoodsReceiptRequestDTO.GrItemRequestDTO();
        item.setProductId(1L);
        item.setReceivedQty(1);
        item.setUnitCost(BigDecimal.ONE);
        dto.setItems(List.of(item));

        GoodsReceipt gr = GoodsReceipt.builder().id(1L).status(DocumentStatus.POSTED).build();
        when(grRepository.findById(1L)).thenReturn(Optional.of(gr));

        assertThrows(RuntimeException.class, () -> service.updateDraftGoodsReceipt(1L, dto));
    }

    @Test
    void completeGoodsReceipt_shouldRejectWhenCancelled() {
        GoodsReceipt gr = GoodsReceipt.builder().id(1L).status(DocumentStatus.CANCELLED).build();
        when(grRepository.findById(1L)).thenReturn(Optional.of(gr));

        assertThrows(RuntimeException.class, () -> service.completeGoodsReceipt(1L));
    }
}
