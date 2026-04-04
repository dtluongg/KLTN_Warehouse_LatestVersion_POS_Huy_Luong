package IUH.KLTN.LvsH.backend_refactor.service;

import IUH.KLTN.LvsH.backend_refactor.entity.Staff;
import java.util.List;

public interface StaffService {
    List<Staff> getAllStaffs();
    Staff getStaffById(Long id);
    Staff createStaff(Staff staff);
    Staff updateStaff(Long id, Staff staff);
    void deleteStaff(Long id);
}
