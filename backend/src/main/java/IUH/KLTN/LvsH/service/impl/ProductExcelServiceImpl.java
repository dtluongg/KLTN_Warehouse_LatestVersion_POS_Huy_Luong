package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.entity.Category;
import IUH.KLTN.LvsH.entity.Product;
import IUH.KLTN.LvsH.dto.product.ProductSearchCriteria;
import IUH.KLTN.LvsH.repository.CategoryRepository;
import IUH.KLTN.LvsH.repository.ProductRepository;
import IUH.KLTN.LvsH.repository.specification.ProductSpecification;
import IUH.KLTN.LvsH.service.ProductExcelService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductExcelServiceImpl implements ProductExcelService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    private static final String[] HEADERS = {
            "SKU (*)", "Tên SP (*)", "Barcode", "Tên ngắn", "Mã Danh mục (*)", "Giá bán (*)", "Thuế VAT (%)", "URL Ảnh", "Đang KD (1/0)"
    };

    @Override
    public ByteArrayInputStream exportProductsToExcel(ProductSearchCriteria criteria) {
        List<Product> products = productRepository.findAll(ProductSpecification.withCriteria(criteria));

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Products");

            // Header Row
            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < HEADERS.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(HEADERS[col]);
            }

            int rowIdx = 1;
            for (Product p : products) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(p.getSku());
                row.createCell(1).setCellValue(p.getName());
                row.createCell(2).setCellValue(p.getBarcode() != null ? p.getBarcode() : "");
                row.createCell(3).setCellValue(p.getShortName() != null ? p.getShortName() : "");
                row.createCell(4).setCellValue(p.getCategory() != null ? p.getCategory().getId().toString() : "");
                row.createCell(5).setCellValue(p.getSalePrice() != null ? p.getSalePrice().doubleValue() : 0);
                row.createCell(6).setCellValue(p.getVatRate() != null ? p.getVatRate().doubleValue() : 0);
                row.createCell(7).setCellValue(p.getImageUrl() != null ? p.getImageUrl() : "");
                row.createCell(8).setCellValue(p.getIsActive() != null && p.getIsActive() ? "1" : "0");
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Fail to import data to Excel file: " + e.getMessage());
        }
    }

    @Override
    public ByteArrayInputStream downloadTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Template");

            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < HEADERS.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(HEADERS[col]);
            }

            // Add an example row
            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue("SP-EX-001");
            exampleRow.createCell(1).setCellValue("Sản phẩm ví dụ");
            exampleRow.createCell(2).setCellValue("893512345");
            exampleRow.createCell(3).setCellValue("SP Ví dụ");
            exampleRow.createCell(4).setCellValue("1"); // assuming category ID 1
            exampleRow.createCell(5).setCellValue(150000);
            exampleRow.createCell(6).setCellValue(8);
            exampleRow.createCell(7).setCellValue("");
            exampleRow.createCell(8).setCellValue("1");

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Fail to generate template: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> importProductsFromExcel(MultipartFile file) throws IOException {
        List<Product> productsToSave = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int successCount = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            int rowNumber = 0;
            while (rows.hasNext()) {
                Row currentRow = rows.next();

                // Skip header
                if (rowNumber == 0) {
                    rowNumber++;
                    continue;
                }

                try {
                    String sku = getCellStringValue(currentRow.getCell(0));
                    if (sku == null || sku.trim().isEmpty()) {
                        throw new IllegalArgumentException("SKU không được để trống.");
                    }
                    if (productRepository.existsBySkuAndDeletedAtIsNull(sku)) {
                        throw new IllegalArgumentException("SKU '" + sku + "' đã tồn tại trong hệ thống.");
                    }

                    String name = getCellStringValue(currentRow.getCell(1));
                    if (name == null || name.trim().isEmpty()) {
                        throw new IllegalArgumentException("Tên sản phẩm không được để trống.");
                    }

                    String barcode = getCellStringValue(currentRow.getCell(2));
                    String shortName = getCellStringValue(currentRow.getCell(3));

                    String catIdStr = getCellStringValue(currentRow.getCell(4));
                    if (catIdStr == null || catIdStr.trim().isEmpty()) {
                        throw new IllegalArgumentException("Mã Danh mục không được để trống.");
                    }
                    Long categoryId = Double.valueOf(catIdStr).longValue();
                    Category category = categoryRepository.findById(categoryId)
                            .orElseThrow(() -> new IllegalArgumentException("Danh mục ID " + categoryId + " không tồn tại."));

                    String priceStr = getCellStringValue(currentRow.getCell(5));
                    BigDecimal salePrice = BigDecimal.ZERO;
                    if (priceStr != null && !priceStr.trim().isEmpty()) {
                        salePrice = new BigDecimal(priceStr);
                    }
                    if (salePrice.compareTo(BigDecimal.ZERO) < 0) {
                        throw new IllegalArgumentException("Giá bán không được âm.");
                    }

                    String vatStr = getCellStringValue(currentRow.getCell(6));
                    BigDecimal vatRate = BigDecimal.ZERO;
                    if (vatStr != null && !vatStr.trim().isEmpty()) {
                        vatRate = new BigDecimal(vatStr);
                    }

                    String imageUrl = getCellStringValue(currentRow.getCell(7));
                    String activeStr = getCellStringValue(currentRow.getCell(8));
                    boolean isActive = activeStr == null || !activeStr.equals("0");

                    Product p = Product.builder()
                            .sku(sku)
                            .name(name)
                            .barcode(barcode)
                            .shortName(shortName)
                            .category(category)
                            .salePrice(salePrice)
                            .vatRate(vatRate)
                            .imageUrl(imageUrl)
                            .isActive(isActive)
                            .build();

                    productsToSave.add(p);
                    successCount++;
                } catch (Exception e) {
                    errors.add("Dòng " + (rowNumber + 1) + ": " + e.getMessage());
                }
                rowNumber++;
            }
        }

        if (!productsToSave.isEmpty()) {
            productRepository.saveAll(productsToSave);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("successCount", successCount);
        response.put("errors", errors);
        return response;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return null;
        }
    }
}
