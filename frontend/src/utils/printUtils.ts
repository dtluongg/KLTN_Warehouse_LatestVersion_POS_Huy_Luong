import * as Print from 'expo-print';
import { Platform } from 'react-native';
import { showAlert } from './alerts';

export const printDocument = async (htmlContent: string) => {
    try {
        if (Platform.OS === 'web') {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(htmlContent);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
            } else {
                showAlert("Lỗi", "Vui lòng cho phép popup để in.");
            }
        } else {
            await Print.printAsync({
                html: htmlContent,
            });
        }
    } catch (error) {
        console.error("Lỗi khi in:", error);
        showAlert("Lỗi in ấn", "Không thể thực hiện lệnh in. Vui lòng thử lại.");
    }
};
