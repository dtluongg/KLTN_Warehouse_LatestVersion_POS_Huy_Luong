package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.category.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CategoryService {
    Page<CategoryResponseDTO> getAllCategories(CategorySearchCriteria criteria, Pageable pageable);
    CategoryResponseDTO getCategoryDetailById(Long id);
    CategoryResponseDTO createCategory(CategoryRequestDTO request);
    CategoryResponseDTO updateCategory(Long id, CategoryRequestDTO request);
    void deleteCategory(Long id);
}
