package IUH.KLTN.LvsH.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StaffSelfUpdateRequestDTO {
    @NotBlank(message = "fullName is required")
    private String fullName;

    private String phone;

    @Email(message = "email is invalid")
    private String email;

    private String taxCode;
    private String address;

    // Optional: if provided, password will be re-hashed before saving.
    private String newPassword;
}
