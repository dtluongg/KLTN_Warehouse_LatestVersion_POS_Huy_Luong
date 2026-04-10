package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.customer_return.*;
import IUH.KLTN.LvsH.service.CustomerReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer-returns")
@RequiredArgsConstructor
public class CustomerReturnController {

    private final CustomerReturnService returnService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<Page<CustomerReturnListResponseDTO>> getAllCustomerReturns(
            CustomerReturnSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
            
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(returnService.getAllCustomerReturns(criteria, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<CustomerReturnDetailResponseDTO> getCustomerReturnById(@PathVariable Long id) {
        return ResponseEntity.ok(returnService.getCustomerReturnDetailById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<CustomerReturnDetailResponseDTO> createCustomerReturn(@Valid @RequestBody CustomerReturnRequestDTO request) {
        return ResponseEntity.ok(returnService.createCustomerReturn(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<CustomerReturnDetailResponseDTO> updateDraftCustomerReturn(
            @PathVariable Long id, 
            @Valid @RequestBody CustomerReturnRequestDTO request) {
        return ResponseEntity.ok(returnService.updateDraftCustomerReturn(id, request));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF')")
    public ResponseEntity<CustomerReturnDetailResponseDTO> completeCustomerReturn(@PathVariable Long id) {
        return ResponseEntity.ok(returnService.completeCustomerReturn(id));
    }
}
