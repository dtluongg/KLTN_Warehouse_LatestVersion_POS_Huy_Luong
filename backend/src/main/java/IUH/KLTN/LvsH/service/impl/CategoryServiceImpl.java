package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.category.*;
import IUH.KLTN.LvsH.entity.Category;
import IUH.KLTN.LvsH.repository.CategoryRepository;
import IUH.KLTN.LvsH.repository.specification.CategorySpecification;
import IUH.KLTN.LvsH.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public Page<CategoryResponseDTO> getAllCategories(CategorySearchCriteria criteria, Pageable pageable) {
        Page<Category> page = categoryRepository.findAll(CategorySpecification.withCriteria(criteria), pageable);
        return page.map(this::toResponseDTO);
    }

    private Category getCategoryById(Long id) {
        return categoryRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    @Override
    public CategoryResponseDTO getCategoryDetailById(Long id) {
        return toResponseDTO(getCategoryById(id));
    }

    @Override
    public CategoryResponseDTO createCategory(CategoryRequestDTO request) {
        Category category = Category.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        return toResponseDTO(categoryRepository.save(category));
    }

    @Override
    public CategoryResponseDTO updateCategory(Long id, CategoryRequestDTO request) {
        Category category = getCategoryById(id);
        category.setName(request.getName());
        category.setSlug(request.getSlug());
        if(request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }
        return toResponseDTO(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = getCategoryById(id);
        category.setDeletedAt(LocalDateTime.now());
        categoryRepository.save(category);
    }

    private CategoryResponseDTO toResponseDTO(Category category) {
        return CategoryResponseDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .isActive(category.getIsActive())
                .build();
    }
}
