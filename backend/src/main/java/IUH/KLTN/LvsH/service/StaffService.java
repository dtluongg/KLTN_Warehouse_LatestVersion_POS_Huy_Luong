package IUH.KLTN.LvsH.service;

import IUH.KLTN.LvsH.dto.StaffSelfUpdateRequestDTO;
import IUH.KLTN.LvsH.dto.staff.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StaffService {
    Page<StaffResponseDTO> getAllStaffs(StaffSearchCriteria criteria, Pageable pageable);
    StaffResponseDTO getStaffDetailById(Long id);
    StaffResponseDTO createStaff(StaffRequestDTO request);
    StaffResponseDTO updateStaff(Long id, StaffRequestDTO request);
    StaffResponseDTO getCurrentStaff(String username);
    StaffResponseDTO updateMyProfile(String username, StaffSelfUpdateRequestDTO request);
    void deleteStaff(Long id);
}
