package IUH.KLTN.LvsH.dto.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequestDTO {
    @NotBlank(message = "Vui lòng nhập mã SKU")
    private String sku;
    private String barcode;
    @NotBlank(message = "Vui lòng nhập tên sản phẩm")
    private String name;
    private String shortName;
    @NotNull(message = "Vui lòng chọn danh mục")
    private Long categoryId;
    @NotNull(message = "Vui lòng nhập giá bán")
    @Min(value = 0, message = "Giá bán không hợp lệ")
    private BigDecimal salePrice;
    private BigDecimal vatRate;
    private String imageUrl;
    private Boolean isActive;
}
