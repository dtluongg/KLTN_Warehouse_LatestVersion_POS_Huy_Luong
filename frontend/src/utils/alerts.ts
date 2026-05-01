import { Alert, Platform } from "react-native";

type AlertButton = {
    text?: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive";
};

const formatMessage = (title: string, message?: string) =>
    [title, message].filter(Boolean).join("\n\n");

export const showAlert = (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: Parameters<typeof Alert.alert>[3],
) => {
    if (Platform.OS !== "web" || typeof globalThis.alert !== "function") {
        Alert.alert(title, message, buttons, options);
        return;
    }

    if (!buttons || buttons.length <= 1) {
        globalThis.alert(formatMessage(title, message));
        buttons?.[0]?.onPress?.();
        return;
    }

    const cancelButton = buttons.find((button) => button.style === "cancel");
    const actionButtons = buttons.filter((button) => button.style !== "cancel");

    if (actionButtons.length <= 1 && typeof globalThis.confirm === "function") {
        const confirmed = globalThis.confirm(formatMessage(title, message));
        const selected = confirmed ? actionButtons[0] : cancelButton;
        selected?.onPress?.();
        return;
    }

    if (typeof globalThis.prompt === "function") {
        const promptMessage = [
            formatMessage(title, message),
            "",
            ...buttons.map((button, index) => `${index + 1}. ${button.text || "OK"}`),
        ].join("\n");
        const answer = globalThis.prompt(promptMessage);
        const selectedIndex = Number(answer) - 1;
        const selected = Number.isInteger(selectedIndex) ? buttons[selectedIndex] : cancelButton;
        selected?.onPress?.();
        return;
    }

    globalThis.alert(formatMessage(title, message));
};

export const showConfirm = (
    title: string,
    message: string,
    confirmText = "OK",
    destructive = false,
) =>
    new Promise<boolean>((resolve) => {
        showAlert(title, message, [
            { text: "Không", style: "cancel", onPress: () => resolve(false) },
            {
                text: confirmText,
                style: destructive ? "destructive" : "default",
                onPress: () => resolve(true),
            },
        ]);
    });

