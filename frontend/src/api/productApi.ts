import { axiosClient } from "./axiosClient";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const exportProductsToExcel = async (params?: Record<string, any>) => {
    try {
        const response = await axiosClient.get("/products/export", {
            params,
            responseType: "blob",
        });

        if (Platform.OS === 'web') {
            const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'products.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } else {
            const fileUri = FileSystem.documentDirectory + "products.xlsx";
            // convert blob to base64
            const reader = new FileReader();
            reader.onload = async () => {
                const base64data = (reader.result as string).split(',')[1];
                await FileSystem.writeAsStringAsync(fileUri, base64data, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                await Sharing.shareAsync(fileUri);
            };
            reader.readAsDataURL(response.data as Blob);
        }
    } catch (error) {
        console.error("Export failed", error);
        throw error;
    }
};

export const downloadProductTemplate = async () => {
    try {
        const response = await axiosClient.get("/products/export/template", {
            responseType: "blob",
        });

        if (Platform.OS === 'web') {
            const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'product_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } else {
            const fileUri = FileSystem.documentDirectory + "product_template.xlsx";
            const reader = new FileReader();
            reader.onload = async () => {
                const base64data = (reader.result as string).split(',')[1];
                await FileSystem.writeAsStringAsync(fileUri, base64data, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                await Sharing.shareAsync(fileUri);
            };
            reader.readAsDataURL(response.data as Blob);
        }
    } catch (error) {
        console.error("Download template failed", error);
        throw error;
    }
};

export const importProductsFromExcel = async (fileUri: string, mimeType: string, fileName: string) => {
    const formData = new FormData();
    if (Platform.OS === 'web') {
        // web approach requires passing the actual File object, but we get uri from document picker
        // We will fetch the blob first
        const response = await fetch(fileUri);
        const blob = await response.blob();
        formData.append("file", new File([blob], fileName, { type: mimeType }));
    } else {
        formData.append("file", {
            uri: fileUri,
            name: fileName,
            type: mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        } as any);
    }

    const res = await axiosClient.post("/products/import", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data;
};
