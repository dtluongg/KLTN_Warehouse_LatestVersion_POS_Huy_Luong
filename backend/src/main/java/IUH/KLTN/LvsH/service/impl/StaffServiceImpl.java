package IUH.KLTN.LvsH.service.impl;

import IUH.KLTN.LvsH.dto.StaffSelfUpdateRequestDTO;
import IUH.KLTN.LvsH.entity.Staff;
import IUH.KLTN.LvsH.repository.StaffRepository;
import IUH.KLTN.LvsH.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<Staff> getAllStaffs() {
        return staffRepository.findByDeletedAtIsNull();
    }

    @Override
    public Staff getStaffById(Long id) {
        return staffRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
    }

    @Override
    public Staff createStaff(Staff staff) {
        // KiÃ¡Â»Æ’m tra username Ã„â€˜ÃƒÂ£ tÃ¡Â»â€œn tÃ¡ÂºÂ¡i chÃ†Â°a
        Optional<Staff> existingUser = staffRepository.findByUsername(staff.getUsername());
        if (existingUser.isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        
        // Hash password trÃ†Â°Ã¡Â»â€ºc khi lÃ†Â°u
        if (staff.getPasswordHash() != null && !staff.getPasswordHash().isEmpty()) {
            staff.setPasswordHash(passwordEncoder.encode(staff.getPasswordHash()));
        }

        return staffRepository.save(staff);
    }

    @Override
    public Staff updateStaff(Long id, Staff staffDetails) {
        Staff staff = getStaffById(id);
        staff.setStaffCode(staffDetails.getStaffCode());
        staff.setFullName(staffDetails.getFullName());
        staff.setPhone(staffDetails.getPhone());
        staff.setEmail(staffDetails.getEmail());
        staff.setTaxCode(staffDetails.getTaxCode());
        staff.setAddress(staffDetails.getAddress());
        staff.setHireDate(staffDetails.getHireDate());
        staff.setIsActive(staffDetails.getIsActive());
        staff.setRole(staffDetails.getRole());

        // NÃ¡ÂºÂ¿u cÃƒÂ³ truyÃ¡Â»Ân password mÃ¡Â»â€ºi lÃƒÂªn thÃƒÂ¬ mÃ¡Â»â€ºi hash vÃƒÂ  cÃ¡ÂºÂ­p nhÃ¡ÂºÂ­t
        if (staffDetails.getPasswordHash() != null && !staffDetails.getPasswordHash().isEmpty()) {
            staff.setPasswordHash(passwordEncoder.encode(staffDetails.getPasswordHash()));
        }

        return staffRepository.save(staff);
    }

    @Override
    public Staff getCurrentStaff(String username) {
        return staffRepository.findByUsernameAndDeletedAtIsNull(username)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
    }

    @Override
    public Staff updateMyProfile(String username, StaffSelfUpdateRequestDTO request) {
        Staff staff = getCurrentStaff(username);

        staff.setFullName(request.getFullName());
        staff.setPhone(request.getPhone());
        staff.setEmail(request.getEmail());
        staff.setTaxCode(request.getTaxCode());
        staff.setAddress(request.getAddress());

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            staff.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        return staffRepository.save(staff);
    }

    @Override
    public void deleteStaff(Long id) {
        Staff staff = getStaffById(id);
        staff.setDeletedAt(LocalDateTime.now());
        staffRepository.save(staff);
    }
}
