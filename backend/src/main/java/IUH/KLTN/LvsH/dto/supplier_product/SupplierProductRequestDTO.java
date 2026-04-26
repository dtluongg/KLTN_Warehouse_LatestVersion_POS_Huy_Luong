package IUH.KLTN.LvsH.dto.supplier_product;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class SupplierProductRequestDTO {

    @NotNull(message = "Vui lòng chọn nhà cung cấp")
    private UUID supplierId;

    @NotNull(message = "Vui lòng chọn sản phẩm")
    private Long productId;

    @NotNull(message = "Vui lòng nhập giá mua mặc định")
    @PositiveOrZero(message = "Giá mua mặc định không được âm")
    private BigDecimal standardPrice;

    private Boolean isActive = true;
}
