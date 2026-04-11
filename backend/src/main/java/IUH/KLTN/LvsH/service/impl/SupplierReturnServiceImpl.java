package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.supplier_return.*;
import IUH.KLTN.LvsH.entity.*;
import IUH.KLTN.LvsH.enums.DocumentStatus;
import IUH.KLTN.LvsH.enums.InventoryMovementType;
import IUH.KLTN.LvsH.repository.*;
import IUH.KLTN.LvsH.repository.specification.SupplierReturnSpecification;
import IUH.KLTN.LvsH.service.SupplierReturnService;
import IUH.KLTN.LvsH.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierReturnServiceImpl implements SupplierReturnService {

    private final SupplierReturnRepository srRepository;
    private final SupplierReturnItemRepository srItemRepository;
    private final SupplierRepository supplierRepository;
    private final GoodsReceiptRepository grRepository;
    private final GoodsReceiptItemRepository grItemRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryMovementRepository movementRepository;

    @Override
    public Page<SupplierReturnListResponseDTO> getAllSupplierReturns(SupplierReturnSearchCriteria criteria, Pageable pageable) {
        Page<SupplierReturn> page = srRepository.findAll(SupplierReturnSpecification.withCriteria(criteria), pageable);
        return page.map(sr -> SupplierReturnListResponseDTO.builder()
                .id(sr.getId())
                .returnNo(sr.getReturnNo())
                .supplierName(sr.getSupplier().getName())
                .goodsReceiptId(sr.getGoodsReceipt() != null ? sr.getGoodsReceipt().getId() : null)
                .warehouseName(sr.getWarehouse() != null ? sr.getWarehouse().getName() : null)
                .returnDate(sr.getReturnDate())
                .status(sr.getStatus().name())
                .totalAmountPayable(sr.getTotalAmountPayable())
                .createdBy(sr.getCreatedBy().getFullName())
                .createdAt(sr.getCreatedAt())
                .note(sr.getNote())
                .build());
    }

    private SupplierReturn getSupplierReturnEntityById(Long id) {
        return srRepository.findById(id).orElseThrow(() -> new RuntimeException("Supplier Return not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierReturnDetailResponseDTO getSupplierReturnDetailById(Long id) {
        SupplierReturn sr = getSupplierReturnEntityById(id);
        List<SupplierReturnItem> items = srItemRepository.findBySupplierReturnId(sr.getId());
        
        List<SupplierReturnDetailResponseDTO.SupplierReturnItemResponseDTO> itemDTOs = items.stream().map(i -> 
                SupplierReturnDetailResponseDTO.SupplierReturnItemResponseDTO.builder()
                        .id(i.getId())
                        .productId(i.getProduct().getId())
                        .productSku(i.getProduct().getSku())
                        .productName(i.getProduct().getName())
                        .goodsReceiptItemId(i.getGoodsReceiptItem() != null ? i.getGoodsReceiptItem().getId() : null)
                        .qty(i.getQty())
                        .returnAmount(i.getReturnAmount())
                        .note(i.getNote())
                        .build()
        ).collect(Collectors.toList());

        return SupplierReturnDetailResponseDTO.builder()
                .id(sr.getId())
                .returnNo(sr.getReturnNo())
                .supplierId(sr.getSupplier().getId().toString())
                .supplierName(sr.getSupplier().getName())
                .goodsReceiptId(sr.getGoodsReceipt() != null ? sr.getGoodsReceipt().getId() : null)
                .goodsReceiptNo(sr.getGoodsReceipt() != null ? sr.getGoodsReceipt().getGrNo() : null)
                .warehouseId(sr.getWarehouse() != null ? sr.getWarehouse().getId() : null)
                .warehouseName(sr.getWarehouse() != null ? sr.getWarehouse().getName() : null)
                .returnDate(sr.getReturnDate())
                .status(sr.getStatus().name())
                .note(sr.getNote())
                .totalAmount(sr.getTotalAmount())
                .totalVat(sr.getTotalVat())
                .discountAmount(sr.getDiscountAmount())
                .surchargeAmount(sr.getSurchargeAmount())
                .totalAmountPayable(sr.getTotalAmountPayable())
                .createdBy(sr.getCreatedBy().getFullName())
                .createdAt(sr.getCreatedAt())
                .items(itemDTOs)
                .build();
    }

    @Override
    @Transactional
    public SupplierReturnDetailResponseDTO createSupplierReturn(SupplierReturnRequestDTO dto) {
        validateItemList(dto.getItems());

        Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Staff staff = getAuthenticatedStaff();
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        GoodsReceipt goodsReceipt = null;
        if (dto.getGoodsReceiptId() != null) {
            goodsReceipt = grRepository.findById(dto.getGoodsReceiptId()).orElse(null);
        }

        validateAgainstGoodsReceiptItemLimits(dto.getItems(), goodsReceipt, null);

        BigDecimal discount = dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal surcharge = dto.getSurchargeAmount() != null ? dto.getSurchargeAmount() : BigDecimal.ZERO;

        Totals totals = calculateTotals(dto.getItems(), surcharge, discount);

        SupplierReturn sr = SupplierReturn.builder()
                .supplier(supplier)
                .goodsReceipt(goodsReceipt)
                .warehouse(warehouse)
                .returnDate(LocalDate.now())
                .status(DocumentStatus.DRAFT)
                .note(dto.getNote())
                .discountAmount(discount)
                .surchargeAmount(surcharge)
                .totalAmount(totals.totalAmount)
                .totalVat(totals.totalVat)
                .totalAmountPayable(totals.totalAmountPayable)
                .createdBy(staff)
                .build();

        srRepository.saveAndFlush(sr);
        String generatedReturnNo = srRepository.findReturnNoById(sr.getId());
        sr.setReturnNo(generatedReturnNo);

        for (SupplierReturnRequestDTO.SupplierReturnItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            GoodsReceiptItem grItem = null;
            if (itemDto.getGoodsReceiptItemId() != null) {
                grItem = grItemRepository.findById(itemDto.getGoodsReceiptItemId())
                        .orElseThrow(() -> new RuntimeException("Goods Receipt Item not found"));
                
                if (goodsReceipt != null && (grItem.getGoodsReceipt() == null || !grItem.getGoodsReceipt().getId().equals(goodsReceipt.getId()))) {
                    throw new RuntimeException("Goods Receipt Item does not belong to the specified Goods Receipt: " + dto.getGoodsReceiptId());
                }
            }

            SupplierReturnItem item = SupplierReturnItem.builder()
                    .supplierReturn(sr)
                    .goodsReceiptItem(grItem)
                    .product(product)
                    .qty(itemDto.getQty())
                    .returnAmount(itemDto.getReturnAmount())
                    .note(itemDto.getNote())
                    .build();

            srItemRepository.save(item);
        }

        return getSupplierReturnDetailById(sr.getId());
    }

    private Staff getAuthenticatedStaff() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new RuntimeException("Unauthenticated request");
        }
        return userDetails.getStaff();
    }

    @Override
    @Transactional
    public SupplierReturnDetailResponseDTO cancelDraftSupplierReturn(Long id) {
        SupplierReturn sr = getSupplierReturnEntityById(id);

        if (sr.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Posted supplier return cannot be cancelled");
        }
        if (sr.getStatus() == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Supplier return is already cancelled");
        }

        Staff currentStaff = getAuthenticatedStaff();
        boolean isAdmin = currentStaff.getRole() != null && currentStaff.getRole().equalsIgnoreCase("ADMIN");
        boolean isOwner = sr.getCreatedBy() != null && sr.getCreatedBy().getId() != null && sr.getCreatedBy().getId().equals(currentStaff.getId());

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("You do not have permission to cancel this supplier return");
        }

        sr.setStatus(DocumentStatus.CANCELLED);
        srRepository.save(sr);
        return getSupplierReturnDetailById(sr.getId());
    }

    @Override
    @Transactional
    public SupplierReturnDetailResponseDTO updateDraftSupplierReturn(Long id, SupplierReturnRequestDTO dto) {
        validateItemList(dto.getItems());

        SupplierReturn sr = getSupplierReturnEntityById(id);
        if (sr.getStatus() != DocumentStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT supplier return can be updated");
        }

        Supplier supplier = supplierRepository.findById(UUID.fromString(dto.getSupplierId()))
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Warehouse warehouse = warehouseRepository.findById(dto.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        GoodsReceipt goodsReceipt = null;
        if (dto.getGoodsReceiptId() != null) {
            goodsReceipt = grRepository.findById(dto.getGoodsReceiptId()).orElse(null);
        }

        validateAgainstGoodsReceiptItemLimits(dto.getItems(), goodsReceipt, id);

        BigDecimal discount = dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal surcharge = dto.getSurchargeAmount() != null ? dto.getSurchargeAmount() : BigDecimal.ZERO;

        Totals totals = calculateTotals(dto.getItems(), surcharge, discount);

        sr.setSupplier(supplier);
        sr.setGoodsReceipt(goodsReceipt);
        sr.setWarehouse(warehouse);
        sr.setNote(dto.getNote());
        sr.setDiscountAmount(discount);
        sr.setSurchargeAmount(surcharge);
        sr.setTotalAmount(totals.totalAmount);
        sr.setTotalVat(totals.totalVat);
        sr.setTotalAmountPayable(totals.totalAmountPayable);

        srItemRepository.deleteBySupplierReturnId(sr.getId());
        for (SupplierReturnRequestDTO.SupplierReturnItemRequestDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            GoodsReceiptItem grItem = null;
            if (itemDto.getGoodsReceiptItemId() != null) {
                grItem = grItemRepository.findById(itemDto.getGoodsReceiptItemId())
                        .orElseThrow(() -> new RuntimeException("Goods Receipt Item not found"));
                
                if (goodsReceipt != null && (grItem.getGoodsReceipt() == null || !grItem.getGoodsReceipt().getId().equals(goodsReceipt.getId()))) {
                    throw new RuntimeException("Goods Receipt Item does not belong to the specified Goods Receipt: " + dto.getGoodsReceiptId());
                }
            }

            SupplierReturnItem item = SupplierReturnItem.builder()
                    .supplierReturn(sr)
                    .goodsReceiptItem(grItem)
                    .product(product)
                    .qty(itemDto.getQty())
                    .returnAmount(itemDto.getReturnAmount())
                    .note(itemDto.getNote())
                    .build();

            srItemRepository.save(item);
        }

        srRepository.save(sr);
        return getSupplierReturnDetailById(sr.getId());
    }

    @Override
    @Transactional
    public SupplierReturnDetailResponseDTO completeSupplierReturn(Long id) {
        SupplierReturn sr = getSupplierReturnEntityById(id);

        if (sr.getStatus() == DocumentStatus.CANCELLED) {
            throw new RuntimeException("Cancelled return cannot be completed");
        }
        if (sr.getStatus() == DocumentStatus.POSTED) {
            throw new RuntimeException("Return already completed");
        }

        List<SupplierReturnItem> items = srItemRepository.findBySupplierReturnId(sr.getId());

        for (SupplierReturnItem item : items) {
            if (sr.getGoodsReceipt() != null && item.getGoodsReceiptItem() == null) {
                throw new RuntimeException("Goods receipt item is required when supplier return references a goods receipt");
            }

            GoodsReceiptItem grItem = item.getGoodsReceiptItem();
            if (grItem == null) {
                continue;
            }

            if (grItem.getProduct() == null || !grItem.getProduct().getId().equals(item.getProduct().getId())) {
                throw new RuntimeException("Returned product does not match the referenced goods receipt item");
            }

            Integer postedQty = srItemRepository.sumQtyByGoodsReceiptItemIdAndReturnStatus(grItem.getId(), DocumentStatus.POSTED);
            int alreadyReturnedQty = postedQty == null ? 0 : postedQty;
            int maxQty = grItem.getReceivedQty() == null ? 0 : grItem.getReceivedQty();
            int requestedQty = item.getQty() == null ? 0 : item.getQty();

            if (alreadyReturnedQty + requestedQty > maxQty) {
                throw new RuntimeException("Returned quantity exceeds received quantity for goods receipt item: " + grItem.getId());
            }

            BigDecimal postedAmount = srItemRepository.sumAmountByGoodsReceiptItemIdAndReturnStatus(grItem.getId(), DocumentStatus.POSTED);
            BigDecimal alreadyReturnedAmount = postedAmount == null ? BigDecimal.ZERO : postedAmount;
            BigDecimal maxAmount = grItem.getLineTotal() == null ? BigDecimal.ZERO : grItem.getLineTotal();
            BigDecimal requestedAmount = item.getReturnAmount() == null ? BigDecimal.ZERO : item.getReturnAmount();

            if (alreadyReturnedAmount.add(requestedAmount).compareTo(maxAmount) > 0) {
                throw new RuntimeException("Return amount exceeds original goods receipt item value: " + grItem.getId());
            }
        }

        sr.setStatus(DocumentStatus.POSTED);
        srRepository.save(sr);

        for (SupplierReturnItem item : items) {
            InventoryMovement movement = InventoryMovement.builder()
                    .product(item.getProduct())
                    .warehouse(sr.getWarehouse())
                    .movementType(InventoryMovementType.RETURN_OUT)
                    .qty(item.getQty())
                    .refTable("supplier_returns")
                    .refId(sr.getReturnNo())
                    .createdBy(sr.getCreatedBy())
                    .build();

            movementRepository.save(movement);
        }

        return getSupplierReturnDetailById(sr.getId());
    }

    private void validateItemList(List<SupplierReturnRequestDTO.SupplierReturnItemRequestDTO> items) {
        if (items == null || items.isEmpty()) {
            throw new RuntimeException("Supplier return items are required");
        }
        for (SupplierReturnRequestDTO.SupplierReturnItemRequestDTO itemDto : items) {
            if (itemDto.getQty() == null || itemDto.getQty() <= 0) {
                throw new RuntimeException("qty must be greater than 0");
            }
            if (itemDto.getReturnAmount() == null || itemDto.getReturnAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("returnAmount must be >= 0");
            }
        }
    }

    private Totals calculateTotals(List<SupplierReturnRequestDTO.SupplierReturnItemRequestDTO> items, BigDecimal surcharge, BigDecimal discount) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;

        for (SupplierReturnRequestDTO.SupplierReturnItemRequestDTO itemDto : items) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            BigDecimal lineAmount = itemDto.getReturnAmount();
            BigDecimal vatRate = product.getVatRate() == null ? BigDecimal.ZERO : product.getVatRate();
            BigDecimal lineVat = lineAmount.multiply(vatRate).divide(BigDecimal.valueOf(100));

            totalAmount = totalAmount.add(lineAmount);
            totalVat = totalVat.add(lineVat);
        }

        BigDecimal payable = totalAmount.add(totalVat).add(surcharge).subtract(discount);
        if (payable.compareTo(BigDecimal.ZERO) < 0) {
            payable = BigDecimal.ZERO;
        }

        return new Totals(totalAmount, totalVat, payable);
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

    private void validateAgainstGoodsReceiptItemLimits(List<SupplierReturnRequestDTO.SupplierReturnItemRequestDTO> items,
                                                       GoodsReceipt goodsReceipt,
                                                       Long excludedReturnId) {
        for (SupplierReturnRequestDTO.SupplierReturnItemRequestDTO itemDto : items) {
            if (itemDto.getGoodsReceiptItemId() == null) {
                continue;
            }

            GoodsReceiptItem grItem = grItemRepository.findById(itemDto.getGoodsReceiptItemId())
                    .orElseThrow(() -> new RuntimeException("Goods Receipt Item not found"));

            if (goodsReceipt != null && (grItem.getGoodsReceipt() == null || !grItem.getGoodsReceipt().getId().equals(goodsReceipt.getId()))) {
                throw new RuntimeException("Goods Receipt Item does not belong to the specified Goods Receipt: " + goodsReceipt.getId());
            }

            Integer postedQty = excludedReturnId == null
                    ? srItemRepository.sumQtyByGoodsReceiptItemIdAndReturnStatus(grItem.getId(), DocumentStatus.POSTED)
                    : srItemRepository.sumQtyByGoodsReceiptItemIdAndReturnStatusExcludingReturnId(grItem.getId(), DocumentStatus.POSTED, excludedReturnId);
            Integer pendingQty = excludedReturnId == null
                    ? srItemRepository.sumQtyByGoodsReceiptItemIdAndReturnStatus(grItem.getId(), DocumentStatus.DRAFT)
                    : srItemRepository.sumQtyByGoodsReceiptItemIdAndReturnStatusExcludingReturnId(grItem.getId(), DocumentStatus.DRAFT, excludedReturnId);

            int alreadyPosted = postedQty == null ? 0 : postedQty;
            int alreadyPending = pendingQty == null ? 0 : pendingQty;
            int maxQty = grItem.getReceivedQty() == null ? 0 : grItem.getReceivedQty();
            int requestedQty = itemDto.getQty() == null ? 0 : itemDto.getQty();

            if (alreadyPosted + alreadyPending + requestedQty > maxQty) {
                throw new RuntimeException("Returned quantity exceeds available quantity (received - pending - posted) for goods receipt item: " + grItem.getId());
            }

            BigDecimal postedAmount = excludedReturnId == null
                    ? srItemRepository.sumAmountByGoodsReceiptItemIdAndReturnStatus(grItem.getId(), DocumentStatus.POSTED)
                    : srItemRepository.sumAmountByGoodsReceiptItemIdAndReturnStatusExcludingReturnId(grItem.getId(), DocumentStatus.POSTED, excludedReturnId);
            BigDecimal pendingAmount = excludedReturnId == null
                    ? srItemRepository.sumAmountByGoodsReceiptItemIdAndReturnStatus(grItem.getId(), DocumentStatus.DRAFT)
                    : srItemRepository.sumAmountByGoodsReceiptItemIdAndReturnStatusExcludingReturnId(grItem.getId(), DocumentStatus.DRAFT, excludedReturnId);

            BigDecimal alreadyPostedAmount = postedAmount == null ? BigDecimal.ZERO : postedAmount;
            BigDecimal alreadyPendingAmount = pendingAmount == null ? BigDecimal.ZERO : pendingAmount;
            BigDecimal maxAmount = grItem.getLineTotal() == null ? BigDecimal.ZERO : grItem.getLineTotal();
            BigDecimal requestedAmount = itemDto.getReturnAmount() == null ? BigDecimal.ZERO : itemDto.getReturnAmount();

            if (alreadyPostedAmount.add(alreadyPendingAmount).add(requestedAmount).compareTo(maxAmount) > 0) {
                throw new RuntimeException("Return amount exceeds available amount (line total - pending - posted) for goods receipt item: " + grItem.getId());
            }
        }
    }
}
