package com.pos.service;

import com.pos.dto.CreateStockAdjustmentDto;
import com.pos.dto.StockAdjustmentResponseDTO;
import com.pos.entity.StockAdjustment;

import java.util.List;

public interface StockAdjustmentService {
    List<StockAdjustment> getAllAdjustments();
    StockAdjustment getAdjustmentById(Long id);
    StockAdjustmentResponseDTO createAdjustment(CreateStockAdjustmentDto dto);
    StockAdjustmentResponseDTO completeAdjustment(Long id);
}
