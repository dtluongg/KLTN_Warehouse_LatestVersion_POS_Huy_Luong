package com.pos.service.impl;

import com.pos.entity.Staff;
import com.pos.repository.StaffRepository;
import com.pos.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<Staff> getAllStaffs() {
        return staffRepository.findAll();
    }

    @Override
    public Staff getStaffById(Long id) {
        return staffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
    }

    @Override
    public Staff createStaff(Staff staff) {
        // Kiểm tra username đã tồn tại chưa
        Optional<Staff> existingUser = staffRepository.findByUsername(staff.getUsername());
        if (existingUser.isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        
        // Hash password trước khi lưu
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

        // Nếu có truyền password mới lên thì mới hash và cập nhật
        if (staffDetails.getPasswordHash() != null && !staffDetails.getPasswordHash().isEmpty()) {
            staff.setPasswordHash(passwordEncoder.encode(staffDetails.getPasswordHash()));
        }

        return staffRepository.save(staff);
    }

    @Override
    public void deleteStaff(Long id) {
        Staff staff = getStaffById(id);
        staffRepository.delete(staff);
    }
}
