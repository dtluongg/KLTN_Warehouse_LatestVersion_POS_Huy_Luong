package com.pos.service.impl;

import com.pos.dto.PurchaseOrderRequestDTO;
import com.pos.dto.PurchaseOrderResponseDTO;
import com.pos.entity.*;
import com.pos.enums.DocumentStatus;
import com.pos.repository.*;
import com.pos.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository poRepository;
    private final PurchaseOrderItemRepository poItemRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final StaffRepository staffRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    public List<PurchaseOrder> getAllPurchaseOrders() {
        return poRepository.findAll();
    }

    @Override
    public PurchaseOrder getPurchaseOrderById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase Order not found"));
    }

    @Override
    @Transactional
        public PurchaseOrderResponseDTO createPurchaseOrder(PurchaseOrderRequestDTO dto) {
                validateItemList(dto.getItems());

        Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Staff staff = staffRepository.findById(dto.getCreatedByStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        Warehouse warehouse = dto.getWarehouseId() != null 
                ? warehouseRepository.findById(dto.getWarehouseId()).orElse(null) 
                : null;

        Totals totals = calculateTotals(dto.getItems());

        PurchaseOrder po = PurchaseOrder.builder()
                .supplier(supplier)
                .warehouse(warehouse)
                .orderDate(LocalDate.now())
                .expectedDate(dto.getExpectedDate() != null ? LocalDate.parse(dto.getExpectedDate()) : null)
                .status(DocumentStatus.DRAFT)
                .note(dto.getNote())
                .totalAmount(totals.totalAmount)
                .totalVat(totals.totalVat)
                .totalAmountPayable(totals.totalAmountPayable)
                .createdBy(staff)
                .build();

        poRepository.saveAndFlush(po);
        String generatedPoNo = poRepository.findPoNoById(po.getId());
        po.setPoNo(generatedPoNo);
        
        for (PurchaseOrderRequestDTO.PoItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            BigDecimal lineTotal = itemDto.getExpectedUnitCost().multiply(BigDecimal.valueOf(itemDto.getOrderedQty()));

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .product(product)
                    .orderedQty(itemDto.getOrderedQty())
                    .expectedUnitCost(itemDto.getExpectedUnitCost())
                    .lineTotal(lineTotal)
                    .build();

            poItemRepository.save(item);
        }

                return toResponseDTO(po);
    }

        @Override
        @Transactional
        public PurchaseOrderResponseDTO updateDraftPurchaseOrder(Long id, PurchaseOrderRequestDTO dto) {
                validateItemList(dto.getItems());

                PurchaseOrder po = getPurchaseOrderById(id);
                if (po.getStatus() != DocumentStatus.DRAFT) {
                        throw new RuntimeException("Only DRAFT purchase order can be updated");
                }

                Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                                .orElseThrow(() -> new RuntimeException("Supplier not found"));

                Warehouse warehouse = dto.getWarehouseId() != null
                                ? warehouseRepository.findById(dto.getWarehouseId()).orElse(null)
                                : null;

                Totals totals = calculateTotals(dto.getItems());

                po.setSupplier(supplier);
                po.setWarehouse(warehouse);
                po.setExpectedDate(dto.getExpectedDate() != null ? LocalDate.parse(dto.getExpectedDate()) : null);
                po.setNote(dto.getNote());
                po.setTotalAmount(totals.totalAmount);
                po.setTotalVat(totals.totalVat);
                po.setTotalAmountPayable(totals.totalAmountPayable);

                poItemRepository.deleteByPurchaseOrderId(po.getId());
                for (PurchaseOrderRequestDTO.PoItemRequestDTO itemDto : dto.getItems()) {
                        Product product = productRepository.findById(itemDto.getProductId())
                                        .orElseThrow(() -> new RuntimeException("Product not found"));

                        BigDecimal lineTotal = itemDto.getExpectedUnitCost().multiply(BigDecimal.valueOf(itemDto.getOrderedQty()));

                        PurchaseOrderItem item = PurchaseOrderItem.builder()
                                        .purchaseOrder(po)
                                        .product(product)
                                        .orderedQty(itemDto.getOrderedQty())
                                        .expectedUnitCost(itemDto.getExpectedUnitCost())
                                        .lineTotal(lineTotal)
                                        .build();

                        poItemRepository.save(item);
                }

                return toResponseDTO(poRepository.save(po));
        }

    @Override
    @Transactional
        public PurchaseOrderResponseDTO updateStatus(Long id, String newStatus) {
        PurchaseOrder po = getPurchaseOrderById(id);
                DocumentStatus requestedStatus;
                try {
                        requestedStatus = DocumentStatus.valueOf(newStatus.trim().toUpperCase());
                } catch (IllegalArgumentException ex) {
                        throw new RuntimeException("Invalid status: " + newStatus);
                }

                DocumentStatus currentStatus = po.getStatus();
                if (currentStatus == DocumentStatus.POSTED || currentStatus == DocumentStatus.CANCELLED) {
                        throw new RuntimeException("Cannot change status from " + currentStatus);
                }
                if (requestedStatus == DocumentStatus.DRAFT) {
                        throw new RuntimeException("DRAFT is not a valid target status");
                }

                po.setStatus(requestedStatus);
                return toResponseDTO(poRepository.save(po));
    }

        private Totals calculateTotals(List<PurchaseOrderRequestDTO.PoItemRequestDTO> items) {
                BigDecimal totalAmount = BigDecimal.ZERO;
                BigDecimal totalVat = BigDecimal.ZERO;

                for (PurchaseOrderRequestDTO.PoItemRequestDTO itemDto : items) {
                        if (itemDto.getOrderedQty() == null || itemDto.getOrderedQty() <= 0) {
                                throw new RuntimeException("orderedQty must be greater than 0");
                        }
                        if (itemDto.getExpectedUnitCost() == null || itemDto.getExpectedUnitCost().compareTo(BigDecimal.ZERO) < 0) {
                                throw new RuntimeException("expectedUnitCost must be >= 0");
                        }

                        Product product = productRepository.findById(itemDto.getProductId())
                                        .orElseThrow(() -> new RuntimeException("Product not found"));

                        BigDecimal lineTotal = itemDto.getExpectedUnitCost().multiply(BigDecimal.valueOf(itemDto.getOrderedQty()));
                        BigDecimal vatRate = product.getVatRate() == null ? BigDecimal.ZERO : product.getVatRate();
                        BigDecimal lineVat = lineTotal.multiply(vatRate).divide(BigDecimal.valueOf(100));

                        totalAmount = totalAmount.add(lineTotal);
                        totalVat = totalVat.add(lineVat);
                }

                return new Totals(totalAmount, totalVat, totalAmount.add(totalVat));
        }

        private void validateItemList(List<PurchaseOrderRequestDTO.PoItemRequestDTO> items) {
                if (items == null || items.isEmpty()) {
                        throw new RuntimeException("Purchase order items are required");
                }
        }

        private static class Totals {
                private final BigDecimal totalAmount;
                private final BigDecimal totalVat;
                private final BigDecimal totalAmountPayable;

                private Totals(BigDecimal totalAmount, BigDecimal totalVat, BigDecimal totalAmountPayable) {
                        this.totalAmount = totalAmount;
                        this.totalVat = totalVat;
                        this.totalAmountPayable = totalAmountPayable;
                }
        }

        private PurchaseOrderResponseDTO toResponseDTO(PurchaseOrder po) {
                PurchaseOrderResponseDTO res = new PurchaseOrderResponseDTO();
                res.setId(po.getId());
                res.setPoNo(po.getPoNo());
                res.setStatus(po.getStatus());
                res.setTotalAmount(po.getTotalAmount());
                res.setTotalVat(po.getTotalVat());
                res.setTotalAmountPayable(po.getTotalAmountPayable());
                return res;
        }
}
