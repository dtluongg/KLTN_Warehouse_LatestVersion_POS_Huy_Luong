package com.pos.service.impl;

import com.pos.dto.CreateGoodsReceiptDto;
import com.pos.dto.GoodsReceiptResponseDTO;
import com.pos.entity.*;
import com.pos.enums.DocumentStatus;
import com.pos.repository.*;
import com.pos.service.GoodsReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoodsReceiptServiceImpl implements GoodsReceiptService {

    private final GoodsReceiptRepository grRepository;
    private final GoodsReceiptItemRepository grItemRepository;
    private final PurchaseOrderRepository poRepository;
    private final PurchaseOrderItemRepository poItemRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final StaffRepository staffRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    @Override
    public List<GoodsReceipt> getAllGoodsReceipts() {
        return grRepository.findAll();
    }

    @Override
    public GoodsReceipt getGoodsReceiptById(Long id) {
        return grRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goods Receipt not found"));
    }

    @Override
    @Transactional
    public GoodsReceiptResponseDTO createGoodsReceipt(CreateGoodsReceiptDto dto) {
        PurchaseOrder po = poRepository.findById(dto.getPoId())
                .orElseThrow(() -> new RuntimeException("PO not found"));
        Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        Staff staff = staffRepository.findById(dto.getCreatedByStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;

        for (CreateGoodsReceiptDto.GrItemDto itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            BigDecimal lineTotal = itemDto.getUnitCost().multiply(BigDecimal.valueOf(itemDto.getReceivedQty()));
            BigDecimal vatRate = product.getVatRate() == null ? BigDecimal.ZERO : product.getVatRate();
            BigDecimal lineVat = lineTotal.multiply(vatRate).divide(BigDecimal.valueOf(100));

            totalAmount = totalAmount.add(lineTotal);
            totalVat = totalVat.add(lineVat);
        }

        BigDecimal totalAmountPayable = totalAmount.add(totalVat);

        GoodsReceipt gr = GoodsReceipt.builder()
                .purchaseOrder(po)
                .supplier(supplier)
                .warehouse(warehouse)
                .receiptDate(LocalDate.now())
                .status(DocumentStatus.DRAFT)
                .note(dto.getNote())
                .totalAmount(totalAmount)
                .totalVat(totalVat)
                .totalAmountPayable(totalAmountPayable)
                .createdBy(staff)
                .build();

        grRepository.saveAndFlush(gr);
        String generatedGrNo = grRepository.findGrNoById(gr.getId());
        gr.setGrNo(generatedGrNo);
        
        for (CreateGoodsReceiptDto.GrItemDto itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            PurchaseOrderItem poItem = poItemRepository.findById(itemDto.getPoItemId())
                    .orElse(null);

            BigDecimal lineTotal = itemDto.getUnitCost().multiply(BigDecimal.valueOf(itemDto.getReceivedQty()));

            GoodsReceiptItem item = GoodsReceiptItem.builder()
                    .goodsReceipt(gr)
                    .purchaseOrderItem(poItem)
                    .product(product)
                    .receivedQty(itemDto.getReceivedQty())
                    .unitCost(itemDto.getUnitCost())
                    .lineTotal(lineTotal)
                    .build();

            grItemRepository.save(item);
        }

        return toResponseDTO(gr);
    }

    @Override
    @Transactional
    public GoodsReceiptResponseDTO completeGoodsReceipt(Long id) {
        GoodsReceipt gr = getGoodsReceiptById(id);
        
        if (gr.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Goods Receipt is already completed.");
        }

        // 1. Cập nhật trạng thái GR
        gr.setStatus(DocumentStatus.POSTED);
        grRepository.save(gr);

        // Lấy danh sách items để update kho bằng custom query (tạm fix fetch N+1 nếu cần)
        List<GoodsReceiptItem> items = grItemRepository.findAll(); // Tạm lấy hết, thực tế nên gọi theo GR_ID

        for (GoodsReceiptItem item : items) {
            if (item.getGoodsReceipt().getId().equals(gr.getId())) {
                Product product = item.getProduct();
                
                // 2. Tính toán Moving Average Cost
                BigDecimal oldQty = BigDecimal.valueOf(
                    productRepository.calculateGlobalOnHandByProductId(product.getId()));
                BigDecimal oldAvgCost = product.getAvgCost();
                
                BigDecimal receivedQty = BigDecimal.valueOf(item.getReceivedQty());
                BigDecimal incomingUnitCost = item.getUnitCost();

                BigDecimal newTotalValue = oldQty.multiply(oldAvgCost).add(receivedQty.multiply(incomingUnitCost));
                BigDecimal newTotalQty = oldQty.add(receivedQty);
                
                BigDecimal newAvgCost = oldAvgCost; // Default nếu chia 0
                if (newTotalQty.compareTo(BigDecimal.ZERO) > 0) {
                    newAvgCost = newTotalValue.divide(newTotalQty, 2, RoundingMode.HALF_UP);
                }

                // 3. Cập nhật Product
                product.setAvgCost(newAvgCost);
                product.setLastPurchaseCost(incomingUnitCost);
                productRepository.save(product);

                // 4. Ghi nhận Inventory Movement
                InventoryMovement movement = InventoryMovement.builder()
                        .product(product)
                        .warehouse(gr.getWarehouse())
                        .movementType(com.pos.enums.InventoryMovementType.PURCHASE_IN)
                        .qty(item.getReceivedQty())
                        .refTable("goods_receipts")
                        .refId(gr.getGrNo())
                        .createdBy(gr.getCreatedBy())
                        .build();

                inventoryMovementRepository.save(movement);
            }
        }

        // Tự động chuyển PO sang trạng thái DELIVERED nếu trùng khớp (Có thể check qty sau)
        PurchaseOrder po = gr.getPurchaseOrder();
        po.setStatus(DocumentStatus.POSTED);
        poRepository.save(po);

        return toResponseDTO(gr);
    }

    private GoodsReceiptResponseDTO toResponseDTO(GoodsReceipt gr) {
        GoodsReceiptResponseDTO res = new GoodsReceiptResponseDTO();
        res.setId(gr.getId());
        res.setGrNo(gr.getGrNo());
        res.setStatus(gr.getStatus());
        res.setTotalAmount(gr.getTotalAmount());
        res.setTotalVat(gr.getTotalVat());
        res.setTotalAmountPayable(gr.getTotalAmountPayable());
        return res;
    }
}
