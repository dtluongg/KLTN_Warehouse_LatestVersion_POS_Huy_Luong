import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenHeader } from "../components/ui";
import { theme } from "../utils/theme";
import { aiSqlChatApi } from "../api/aiSqlChatApi";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
    sql?: string;
};

const examplePrompts = [
    "Cho tôi 10 đơn hàng mới nhất",
    "Sản phẩm nào tồn kho thấp ở kho chính",
    "Nhà cung cấp nào có nhiều phiếu nhập nhất",
];

const AiSqlChatScreen = () => {
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [expandedSqlIds, setExpandedSqlIds] = useState<string[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome",
            role: "assistant",
            content:
                "Hỏi tôi về đơn hàng, sản phẩm, tồn kho, phiếu nhập/xuất... Tôi sẽ sinh SQL và đọc kết quả giúp bạn.",
            createdAt: new Date().toISOString(),
        },
    ]);
    const canSend = useMemo(
        () => question.trim().length > 0 && !loading,
        [question, loading],
    );

    const toggleSql = (messageId: string) => {
        setExpandedSqlIds((current) =>
            current.includes(messageId)
                ? current.filter((id) => id !== messageId)
                : [...current, messageId],
        );
    };

    const sendQuestion = async (presetQuestion?: string) => {
        const text = (presetQuestion ?? question).trim();
        if (!text || loading) return;

        setLoading(true);
        setErrorMessage(null);

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: text,
            createdAt: new Date().toISOString(),
        };

        setMessages((current) => [...current, userMessage]);
        setQuestion("");

        try {
            const result = await aiSqlChatApi.ask(text);

            const assistantText =
                result.answer || result.summary || "Đã xử lý xong.";
            const assistantMessage: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: assistantText,
                createdAt: new Date().toISOString(),
                sql: result.sql,
            };

            setMessages((current) => [...current, assistantMessage]);
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Không thể kết nối AI SQL Chat.";
            setErrorMessage(message);

            const assistantMessage: ChatMessage = {
                id: `assistant-error-${Date.now()}`,
                role: "assistant",
                content: `Lỗi: ${message}`,
                createdAt: new Date().toISOString(),
            };
            setMessages((current) => [...current, assistantMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScreenHeader
                title="AI Chat SQL"
                subtitle="Hỏi dữ liệu kho, đơn hàng, nhập/xuất bằng ngôn ngữ tự nhiên"
            />

            <View style={styles.body}>
                <View style={styles.promptCard}>
                    <Text style={styles.cardTitle}>Gợi ý câu hỏi</Text>
                    <View style={styles.promptChips}>
                        {examplePrompts.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.promptChip}
                                onPress={() => sendQuestion(item)}
                                disabled={loading}
                            >
                                <Feather
                                    name="message-circle"
                                    size={14}
                                    color={theme.colors.primary}
                                />
                                <Text style={styles.promptChipText}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <ScrollView
                    style={styles.chatBox}
                    contentContainerStyle={styles.chatContent}
                >
                    {messages.map((message) => (
                        <View
                            key={message.id}
                            style={[
                                styles.bubble,
                                message.role === "user"
                                    ? styles.userBubble
                                    : styles.assistantBubble,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.bubbleRole,
                                    message.role === "user"
                                        ? styles.userRole
                                        : styles.assistantRole,
                                ]}
                            >
                                {message.role === "user" ? "Bạn" : "AI"}
                            </Text>
                            <Text style={styles.bubbleText}>
                                {message.content}
                            </Text>

                            {message.role === "assistant" && message.sql ? (
                                <View style={styles.sqlActionWrap}>
                                    <TouchableOpacity
                                        style={styles.sqlToggleButton}
                                        onPress={() => toggleSql(message.id)}
                                    >
                                        <Feather
                                            name={
                                                expandedSqlIds.includes(
                                                    message.id,
                                                )
                                                    ? "chevron-up"
                                                    : "chevron-down"
                                            }
                                            size={16}
                                            color={theme.colors.primary}
                                        />
                                        <Text style={styles.sqlToggleText}>
                                            {expandedSqlIds.includes(message.id)
                                                ? "Ẩn SQL"
                                                : "Xem SQL"}
                                        </Text>
                                    </TouchableOpacity>

                                    {expandedSqlIds.includes(message.id) ? (
                                        <View style={styles.codeBoxInline}>
                                            <Text style={styles.codeText}>
                                                {message.sql}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            ) : null}
                        </View>
                    ))}

                    {loading ? (
                        <View style={[styles.bubble, styles.assistantBubble]}>
                            <View style={styles.loadingRow}>
                                <ActivityIndicator
                                    size="small"
                                    color={theme.colors.primary}
                                />
                                <Text style={styles.loadingText}>
                                    Đang truy vấn và diễn giải...
                                </Text>
                            </View>
                        </View>
                    ) : null}
                </ScrollView>

                {errorMessage ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                ) : null}

                <View style={styles.inputCard}>
                    <TextInput
                        value={question}
                        onChangeText={setQuestion}
                        placeholder="Nhập câu hỏi về dữ liệu..."
                        placeholderTextColor={theme.colors.mutedForeground}
                        style={styles.input}
                        multiline
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !canSend && styles.sendButtonDisabled,
                        ]}
                        onPress={() => sendQuestion()}
                        disabled={!canSend}
                    >
                        <Feather
                            name="send"
                            size={16}
                            color={theme.colors.primaryForeground}
                        />
                        <Text style={styles.sendButtonText}>
                            {loading ? "Đang gửi" : "Gửi"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default AiSqlChatScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    body: {
        flex: 1,
        padding: theme.spacing.md,
        gap: theme.spacing.md,
    },
    promptCard: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    cardTitle: {
        ...theme.typography.label,
        color: theme.colors.foreground,
    },
    promptChips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    promptChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: theme.colors.primaryLight,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    promptChipText: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: "600",
    },
    chatBox: {
        flex: 1,
    },
    chatContent: {
        gap: 10,
        paddingBottom: theme.spacing.md,
    },
    bubble: {
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    userBubble: {
        backgroundColor: "#eff6ff",
        alignSelf: "flex-end",
        borderColor: "#bfdbfe",
        maxWidth: "92%",
    },
    assistantBubble: {
        backgroundColor: theme.colors.surface,
        alignSelf: "flex-start",
        maxWidth: "92%",
    },
    bubbleRole: {
        fontSize: 11,
        fontWeight: "700",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    userRole: {
        color: "#1d4ed8",
    },
    assistantRole: {
        color: theme.colors.primary,
    },
    bubbleText: {
        ...theme.typography.body,
        color: theme.colors.foreground,
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    loadingText: {
        color: theme.colors.mutedForeground,
        fontSize: 13,
        fontWeight: "500",
    },
    sqlActionWrap: {
        marginTop: 10,
        gap: 8,
    },
    sqlToggleButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
    },
    sqlToggleText: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: "600",
    },
    codeBox: {
        backgroundColor: "#0f172a",
        borderRadius: theme.borderRadius.md,
        padding: 12,
    },
    codeBoxInline: {
        backgroundColor: "#0f172a",
        borderRadius: theme.borderRadius.md,
        padding: 12,
    },
    codeText: {
        color: "#e2e8f0",
        fontFamily: Platform.select({ web: "monospace", default: "monospace" }),
        fontSize: 12,
        lineHeight: 18,
    },
    errorBox: {
        padding: 12,
        backgroundColor: "#fef2f2",
        borderColor: "#fecaca",
        borderWidth: 1,
        borderRadius: theme.borderRadius.md,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 13,
        fontWeight: "600",
    },
    inputCard: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        gap: 10,
    },
    input: {
        minHeight: 88,
        textAlignVertical: "top",
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: theme.colors.foreground,
        fontSize: 14,
        backgroundColor: theme.colors.background,
    },
    sendButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    sendButtonText: {
        color: theme.colors.primaryForeground,
        fontWeight: "700",
        fontSize: 14,
    },
});
