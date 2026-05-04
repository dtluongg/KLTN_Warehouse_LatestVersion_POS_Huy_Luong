package IUH.KLTN.LvsH.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Map;

public interface ProductExcelService {
    ByteArrayInputStream exportProductsToExcel(IUH.KLTN.LvsH.dto.product.ProductSearchCriteria criteria);
    ByteArrayInputStream downloadTemplate();
    Map<String, Object> importProductsFromExcel(MultipartFile file) throws IOException;
}
