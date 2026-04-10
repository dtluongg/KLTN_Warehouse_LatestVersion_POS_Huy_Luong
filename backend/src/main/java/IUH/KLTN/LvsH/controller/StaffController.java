package IUH.KLTN.LvsH.controller;

import IUH.KLTN.LvsH.dto.StaffSelfUpdateRequestDTO;
import IUH.KLTN.LvsH.dto.staff.StaffRequestDTO;
import IUH.KLTN.LvsH.dto.staff.StaffResponseDTO;
import IUH.KLTN.LvsH.dto.staff.StaffSearchCriteria;
import IUH.KLTN.LvsH.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staffs")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<StaffResponseDTO>> getAllStaffs(
            StaffSearchCriteria criteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
            
        Sort sort = direction.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(staffService.getAllStaffs(criteria, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StaffResponseDTO> getStaffById(@PathVariable Long id) {
        return ResponseEntity.ok(staffService.getStaffDetailById(id));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<StaffResponseDTO> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(staffService.getCurrentStaff(authentication.getName()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StaffResponseDTO> createStaff(@Valid @RequestBody StaffRequestDTO request) {
        return ResponseEntity.ok(staffService.createStaff(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StaffResponseDTO> updateStaff(@PathVariable Long id, @Valid @RequestBody StaffRequestDTO request) {
        return ResponseEntity.ok(staffService.updateStaff(id, request));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<StaffResponseDTO> updateMyProfile(Authentication authentication,
                                                 @Valid @RequestBody StaffSelfUpdateRequestDTO request) {
        return ResponseEntity.ok(staffService.updateMyProfile(authentication.getName(), request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }
}
