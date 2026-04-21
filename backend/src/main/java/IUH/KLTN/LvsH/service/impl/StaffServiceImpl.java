package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.StaffSelfUpdateRequestDTO;
import IUH.KLTN.LvsH.dto.staff.*;
import IUH.KLTN.LvsH.entity.Staff;
import IUH.KLTN.LvsH.repository.StaffRepository;
import IUH.KLTN.LvsH.repository.specification.StaffSpecification;
import IUH.KLTN.LvsH.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Page<StaffResponseDTO> getAllStaffs(StaffSearchCriteria criteria, Pageable pageable) {
        Page<Staff> page = staffRepository.findAll(StaffSpecification.withCriteria(criteria), pageable);
        return page.map(this::toResponseDTO);
    }

    private Staff getStaffById(Long id) {
        return staffRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Staff not found: " + id));
    }

    @Override
    public StaffResponseDTO getStaffDetailById(Long id) {
        return toResponseDTO(getStaffById(id));
    }

    @Override
    public StaffResponseDTO createStaff(StaffRequestDTO request) {
        Optional<Staff> existingUser = staffRepository.findByUsername(request.getUsername());
        if (existingUser.isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        Staff staff = Staff.builder()
                // staffCode = null → trigger SQL sẽ tự sinh NV-XXXXX
                .staffCode(null)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .taxCode(request.getTaxCode())
                .address(request.getAddress())
                .hireDate(request.getHireDate())
                .username(request.getUsername())
                .role(request.getRole())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            staff.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        } else {
            staff.setPasswordHash(passwordEncoder.encode("123456")); // Default fallback, should be handled better in real prod
        }

        return toResponseDTO(staffRepository.save(staff));
    }

    @Override
    public StaffResponseDTO updateStaff(Long id, StaffRequestDTO request) {
        Staff staff = getStaffById(id);

        // Check username trùng với nhân viên khác (không tính chính mình)
        if (staffRepository.existsByUsernameAndIdNot(request.getUsername() != null ? request.getUsername() : staff.getUsername(), id)) {
            throw new RuntimeException("Tên đăng nhập đã được dùng bởi nhân viên khác.");
        }

        staff.setFullName(request.getFullName());
        staff.setPhone(request.getPhone());
        staff.setEmail(request.getEmail());
        staff.setTaxCode(request.getTaxCode());
        staff.setAddress(request.getAddress());
        staff.setHireDate(request.getHireDate());
        staff.setRole(request.getRole());

        if (request.getIsActive() != null) {
            staff.setIsActive(request.getIsActive());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            staff.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        return toResponseDTO(staffRepository.save(staff));
    }

    private Staff getStaffEntityByUsername(String username) {
        return staffRepository.findByUsernameAndDeletedAtIsNull(username)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
    }

    @Override
    public StaffResponseDTO getCurrentStaff(String username) {
        return toResponseDTO(getStaffEntityByUsername(username));
    }

    @Override
    public StaffResponseDTO updateMyProfile(String username, StaffSelfUpdateRequestDTO request) {
        Staff staff = getStaffEntityByUsername(username);

        staff.setFullName(request.getFullName());
        staff.setPhone(request.getPhone());
        staff.setEmail(request.getEmail());
        staff.setTaxCode(request.getTaxCode());
        staff.setAddress(request.getAddress());

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            staff.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        return toResponseDTO(staffRepository.save(staff));
    }

    @Override
    public void deleteStaff(Long id) {
        Staff staff = getStaffById(id);
        staff.setDeletedAt(LocalDateTime.now());
        staffRepository.save(staff);
    }

    private StaffResponseDTO toResponseDTO(Staff staff) {
        return StaffResponseDTO.builder()
                .id(staff.getId())
                .staffCode(staff.getStaffCode())
                .fullName(staff.getFullName())
                .phone(staff.getPhone())
                .email(staff.getEmail())
                .taxCode(staff.getTaxCode())
                .address(staff.getAddress())
                .hireDate(staff.getHireDate())
                .username(staff.getUsername())
                .role(staff.getRole())
                .isActive(staff.getIsActive())
                .lastLoginAt(staff.getLastLoginAt())
                .createdAt(staff.getCreatedAt())
                .build();
    }
}
