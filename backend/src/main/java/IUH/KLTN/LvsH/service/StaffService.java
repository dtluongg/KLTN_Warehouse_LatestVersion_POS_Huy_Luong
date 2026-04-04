package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.StaffSelfUpdateRequestDTO;
import IUH.KLTN.LvsH.entity.Staff;
import java.util.List;

public interface StaffService {
    List<Staff> getAllStaffs();
    Staff getStaffById(Long id);
    Staff createStaff(Staff staff);
    Staff updateStaff(Long id, Staff staff);
    Staff getCurrentStaff(String username);
    Staff updateMyProfile(String username, StaffSelfUpdateRequestDTO request);
    void deleteStaff(Long id);
}
