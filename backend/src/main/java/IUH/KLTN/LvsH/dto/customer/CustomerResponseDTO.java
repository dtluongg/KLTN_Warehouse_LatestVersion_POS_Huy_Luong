package IUH.KLTN.LvsH.dto.customer;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CustomerResponseDTO {
    private UUID id;
    private String customerCode;
    private String name;
    private String phone;
    private String email;
    private String taxCode;
    private String address;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
