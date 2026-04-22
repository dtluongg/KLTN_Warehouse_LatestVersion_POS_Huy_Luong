package IUH.KLTN.LvsH.dto.payment;

import lombok.Data;

@Data
public class CreatePaymentLinkResponseDTO {
    private String bin;
    private String accountNumber;
    private String accountName;
    private String amount;
    private String description;
    private String orderCode;
    private String currency;
    private String expireDate;
    private String paymentLinkId;
    private String status;
    private String checkoutUrl;
    private String qrCode;
}
