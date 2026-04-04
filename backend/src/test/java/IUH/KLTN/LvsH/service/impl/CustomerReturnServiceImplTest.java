package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.CustomerReturnRequestDTO;
import IUH.KLTN.LvsH.entity.CustomerReturn;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.repository.CustomerRepository;
import IUH.KLTN.LvsH.repository.CustomerReturnItemRepository;
import IUH.KLTN.LvsH.repository.CustomerReturnRepository;
import IUH.KLTN.LvsH.repository.InventoryMovementRepository;
import IUH.KLTN.LvsH.repository.OrderItemRepository;
import IUH.KLTN.LvsH.repository.OrderRepository;
import IUH.KLTN.LvsH.repository.ProductRepository;
import IUH.KLTN.LvsH.repository.StaffRepository;
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
class CustomerReturnServiceImplTest {

    @Mock
    private CustomerReturnRepository crRepository;
    @Mock
    private CustomerReturnItemRepository crItemRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private StaffRepository staffRepository;
    @Mock
    private InventoryMovementRepository movementRepository;
    @Mock
    private WarehouseRepository warehouseRepository;

    @InjectMocks
    private CustomerReturnServiceImpl service;

    @Test
    void updateDraftCustomerReturn_shouldRejectWhenNotDraft() {
        CustomerReturnRequestDTO dto = new CustomerReturnRequestDTO();
        CustomerReturnRequestDTO.ReturnItemRequestDTO item = new CustomerReturnRequestDTO.ReturnItemRequestDTO();
        item.setProductId(1L);
        item.setQty(1);
        item.setRefundAmount(BigDecimal.ONE);
        dto.setItems(List.of(item));

        CustomerReturn cr = CustomerReturn.builder().id(1L).status(DocumentStatus.POSTED).build();
        when(crRepository.findById(1L)).thenReturn(Optional.of(cr));

        assertThrows(RuntimeException.class, () -> service.updateDraftCustomerReturn(1L, dto));
    }

    @Test
    void completeCustomerReturn_shouldRejectWhenCancelled() {
        CustomerReturn cr = CustomerReturn.builder().id(1L).status(DocumentStatus.CANCELLED).build();
        when(crRepository.findById(1L)).thenReturn(Optional.of(cr));

        assertThrows(RuntimeException.class, () -> service.completeCustomerReturn(1L));
    }
}
