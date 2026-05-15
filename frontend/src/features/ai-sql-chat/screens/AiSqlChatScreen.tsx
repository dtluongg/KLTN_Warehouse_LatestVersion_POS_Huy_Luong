import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import { BarChart, PieChart, LineChart } from "react-native-chart-kit";
import { Feather } from "@expo/vector-icons";
import { ScreenHeader } from "../../../components/ui";
import { theme } from "../../../utils/theme";
import { aiSqlChatApi } from "../../../api/aiSqlChatApi";

type ChatMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
    sql?: string;
    chartType?: string;
    rows?: any[];
};

const screenWidth = Dimensions.get("window").width;

const AiVisualization = ({ rows, chartType }: { rows?: any[], chartType?: string }) => {
    if (!rows || rows.length === 0) return null;

    const renderChart = () => {
        if (!chartType || chartType === 'none') return null;
        
        const keys = Object.keys(rows[0]);
        if (keys.length < 2) return null;
        
        const labelKey = keys[0];
        const valueKey = keys.find(k => typeof rows[0][k] === 'number') || keys[1];

        const labels = rows.map(r => String(r[labelKey]).substring(0, 10));
        const data = rows.map(r => Number(r[valueKey]) || 0);

        const chartConfig = {
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            decimalPlaces: 0,
        };

        if (chartType === 'bar') {
            return (
                <ScrollView horizontal>
                    <BarChart
                        data={{ labels, datasets: [{ data }] }}
                        width={Math.max(screenWidth - 60, labels.length * 60)}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={chartConfig}
                        verticalLabelRotation={30}
                        style={styles.chartStyle}
                    />
                </ScrollView>
            );
        }

        if (chartType === 'line') {
            return (
                <ScrollView horizontal>
                    <LineChart
                        data={{ labels, datasets: [{ data }] }}
                        width={Math.max(screenWidth - 60, labels.length * 60)}
                        height={220}
                        chartConfig={chartConfig}
                        verticalLabelRotation={30}
                        style={styles.chartStyle}
                    />
                </ScrollView>
            );
        }

        if (chartType === 'pie') {
            const pieData = rows.map((r, i) => ({
                name: String(r[labelKey]).substring(0, 15),
                population: Number(r[valueKey]) || 0,
                color: `hsl(${(i * 360) / rows.length}, 70%, 50%)`,
                legendFontColor: "#333",
                legendFontSize: 12
            }));
            return (
                <View style={{alignItems: 'center'}}>
                    <PieChart
                        data={pieData}
                        width={screenWidth - 60}
                        height={220}
                        chartConfig={chartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        absolute
                    />
                </View>
            );
        }

        return null;
    };

    return (
        <View style={styles.visualizationContainer}>
            {renderChart()}
        </View>
    );
};

export const PROMPT_CATEGORIES = [
    {
        title: "Doanh thu & Kế toán lợi nhuận",
        icon: "dollar-sign",
        prompts: [
            "Lợi nhuận trong tháng này là bao nhiêu? Trình bày chi tiết, nhớ trừ đi phần khách hàng trả hàng nữa",
            "Doanh thu thuần của cửa hàng trong 7 ngày qua là bao nhiêu?",
            "Tổng số tiền đã chiết khấu cho khách hàng trong tháng này là bao nhiêu?",
            "Cho tôi xem top 5 sản phẩm mang lại doanh thu cao nhất từ trước đến nay",
            "Lợi nhuận gộp của từng danh mục sản phẩm trong tháng trước là bao nhiêu?",
            "Có bao nhiêu đơn hàng bị lỗ (lợi nhuận âm) trong tháng này?",
            "Tính tổng giá vốn hàng bán (COGS) của tất cả đơn hàng đã bán trong hôm qua",
            "Ngày nào trong tháng này có doanh thu bán hàng cao nhất?",
            "Tổng giá trị mã giảm giá (coupon) đã sử dụng trong năm nay là bao nhiêu?",
            "Tính lợi nhuận trung bình trên mỗi đơn hàng trong tuần qua",
        ]
    },
    {
        title: "Tồn kho & Quản lý sản phẩm",
        icon: "box",
        prompts: [
            "Sản phẩm nào đang có số lượng tồn kho dưới 10 ở kho chính?",
            "Cho tôi xem 10 sản phẩm có số lượng tồn kho nhiều nhất hiện tại",
            "Tổng giá trị tồn kho hiện tại của toàn bộ hệ thống là bao nhiêu?",
            "Danh mục sản phẩm nào đang chiếm giá trị tồn kho lớn nhất?",
            "Có bao nhiêu sản phẩm chưa từng phát sinh giao dịch bán hàng nào?",
            "Lịch sử biến động kho (nhập/xuất) của sản phẩm có mã 'SP001' trong tháng này",
            "Cho tôi biết số lượng tồn kho trung bình của từng danh mục sản phẩm",
            "Sản phẩm nào có giá vốn (avg_cost) cao nhất trong kho?",
            "Có phiếu điều chỉnh kho (stock adjustment) nào làm giảm số lượng tồn kho trong tuần này không?",
            "Hiển thị danh sách các kho và tổng số lượng sản phẩm đang chứa trong từng kho"
        ]
    },
    {
        title: "Nhập hàng & Nhà cung cấp",
        icon: "truck",
        prompts: [
            "Nhà cung cấp nào có tổng giá trị đơn nhập hàng lớn nhất từ trước đến nay?",
            "Tổng số tiền đã trả cho các nhà cung cấp trong tháng này là bao nhiêu?",
            "Cho tôi danh sách các phiếu nhập hàng (goods receipts) chưa được thanh toán hết",
            "Có bao nhiêu đơn đặt hàng (purchase orders) đang ở trạng thái nháp (draft)?",
            "Trung bình mỗi tháng cửa hàng nhập bao nhiêu đơn hàng từ nhà cung cấp 'NCC01'?",
            "Sản phẩm nào được nhập về nhiều nhất trong quý này?",
            "Tổng giá trị hàng đã hoàn trả cho nhà cung cấp (supplier returns) trong năm nay?",
            "Nhà cung cấp nào có tỷ lệ trả hàng cao nhất?",
            "Cho tôi chi tiết các mặt hàng đã nhập trong phiếu nhập có mã 'PN-2023-001'",
            "Ngày dự kiến giao hàng của các đơn đặt hàng chưa nhận là khi nào?"
        ]
    },
    {
        title: "Bán hàng & Khách hàng",
        icon: "users",
        prompts: [
            "Khách hàng nào có tổng chi tiêu mua sắm cao nhất từ trước đến nay?",
            "Cho tôi danh sách 10 khách hàng mới đăng ký trong tháng này",
            "Có bao nhiêu khách hàng chưa quay lại mua hàng trong vòng 3 tháng qua?",
            "Kênh bán hàng (sales channel) nào mang lại nhiều đơn hàng nhất trong năm nay?",
            "Trung bình một khách hàng chi tiêu bao nhiêu tiền cho mỗi đơn hàng?",
            "Khách hàng mua nhiều tiền nhất đã mua những sản phẩm gì?",
            "Cho tôi xem danh sách các đơn hàng chưa thanh toán (công nợ khách hàng)",
            "Phương thức thanh toán nào (tiền mặt/chuyển khoản) được sử dụng nhiều nhất?",
            "Có bao nhiêu đơn hàng bị hủy trong 30 ngày qua và tổng giá trị là bao nhiêu?",
            "Top 5 khách hàng sử dụng mã giảm giá nhiều nhất là ai?"
        ]
    },
    {
        title: "Hoàn trả & Thất thoát",
        icon: "refresh-ccw",
        prompts: [
            "Tổng số lượng và giá trị hàng hóa bị khách hàng hoàn trả trong tháng này?",
            "Sản phẩm nào bị khách hàng trả lại nhiều lần nhất từ trước đến nay?",
            "Tỷ lệ trả hàng (số đơn hoàn trả / tổng số đơn hàng) trong năm nay là bao nhiêu?",
            "Danh mục sản phẩm nào có giá trị hàng trả lại cao nhất?",
            "Khách hàng nào thường xuyên trả lại hàng nhất?",
            "Cho tôi danh sách chi tiết các mặt hàng bị trả lại trong tuần qua",
            "Tổng số tiền đã hoàn lại cho khách hàng qua chuyển khoản là bao nhiêu?",
            "Có phiếu điều chỉnh kho nào ghi nhận lý do là 'hư hỏng' hoặc 'mất mát' không?",
            "Sự chênh lệch (diff_qty) lớn nhất trong một lần kiểm kê kho là bao nhiêu và thuộc sản phẩm nào?",
            "Tháng nào trong năm ngoái có tỷ lệ hoàn trả hàng cao nhất?"
        ]
    },
    {
        title: "Thống kê & Biểu đồ trực quan",
        icon: "pie-chart",
        prompts: [
            "Vẽ biểu đồ đường xu hướng doanh thu bán hàng trong 7 ngày qua",
            "Biểu diễn bằng biểu đồ tròn tỷ lệ sử dụng các phương thức thanh toán",
            "Vẽ biểu đồ cột so sánh top 5 sản phẩm mang lại lợi nhuận cao nhất",
            "Thống kê số lượng đơn hàng theo từng trạng thái (status) bằng biểu đồ tròn",
            "Vẽ biểu đồ cột xem nhà cung cấp nào có tổng giá trị đơn nhập hàng lớn nhất",
            "Biểu diễn doanh thu thuần theo từng ngày trong tuần này bằng biểu đồ đường",
            "Vẽ biểu đồ tròn thể hiện tỷ trọng doanh thu của từng danh mục sản phẩm",
            "Dùng biểu đồ cột so sánh số lượng hàng đã bán của top 10 sản phẩm bán chạy nhất",
            "Vẽ biểu đồ đường xem biến động số lượng đơn hàng bị hủy trong 30 ngày qua",
            "Hiển thị biểu đồ cột so sánh tổng tiền hoàn trả cho khách hàng theo từng tháng trong năm nay"
        ]
    }
];

const getRandomPrompts = (count: number) => {
    const allPrompts = PROMPT_CATEGORIES.flatMap(c => c.prompts);
    const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const AiSqlChatScreen = () => {
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [expandedSqlIds, setExpandedSqlIds] = useState<string[]>([]);
    const [isLibraryVisible, setLibraryVisible] = useState(false);
    const [expandedCategoryIndex, setExpandedCategoryIndex] = useState<number | null>(0);
    const [randomPrompts, setRandomPrompts] = useState<string[]>([]);
    const [showPromptCard, setShowPromptCard] = useState(false); // Mobile: ẩn mặc định

    const { width } = useWindowDimensions();
    const isMobile = width < 1024;

    React.useEffect(() => {
        setRandomPrompts(getRandomPrompts(2));
    }, []);
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
                chartType: result.chartType,
                rows: result.rows,
            };

            setMessages((current) => [...current, assistantMessage]);
        } catch (error: any) {
            const message =
                "Không thể kết nối AI SQL Chat.";

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

            <View style={styles.body}>
                {/* Gợi ý câu hỏi — trên mobile: ẩn/hiện bằng toggle */}
                {isMobile ? (
                    <>
                        <TouchableOpacity
                            style={[styles.promptToggleBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                            onPress={() => setShowPromptCard(v => !v)}
                        >
                            <Feather name="zap" size={14} color={theme.colors.primary} />
                            <Text style={[styles.promptToggleBtnText, { color: theme.colors.primary }]}>
                                {showPromptCard ? "Ẩn gợi ý câu hỏi" : "Gợi ý câu hỏi & Thư viện"}
                            </Text>
                            <Feather name={showPromptCard ? "chevron-up" : "chevron-down"} size={14} color={theme.colors.mutedForeground} />
                        </TouchableOpacity>
                        {showPromptCard && (
                            <View style={styles.promptCard}>
                                <View style={styles.promptChips}>
                                    <TouchableOpacity
                                        style={[styles.promptChip, styles.libraryChip]}
                                        onPress={() => setLibraryVisible(true)}
                                    >
                                        <Feather name="book-open" size={14} color="#fff" />
                                        <Text style={styles.libraryChipText}>📖 Thư viện 50+ câu hỏi</Text>
                                    </TouchableOpacity>
                                    {randomPrompts.map((item) => (
                                        <TouchableOpacity
                                            key={item}
                                            style={styles.promptChip}
                                            onPress={() => sendQuestion(item)}
                                            disabled={loading}
                                        >
                                            <Feather name="message-circle" size={14} color={theme.colors.primary} />
                                            <Text style={styles.promptChipText} numberOfLines={1}>
                                                {item.length > 35 ? item.substring(0, 35) + "..." : item}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </>
                ) : (
                    <View style={styles.promptCard}>
                        <Text style={styles.cardTitle}>Gợi ý câu hỏi</Text>
                        <View style={styles.promptChips}>
                            <TouchableOpacity
                                style={[styles.promptChip, styles.libraryChip]}
                                onPress={() => setLibraryVisible(true)}
                            >
                                <Feather name="book-open" size={14} color="#fff" />
                                <Text style={styles.libraryChipText}>📖 Thư viện 50+ câu hỏi</Text>
                            </TouchableOpacity>
                            {randomPrompts.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={styles.promptChip}
                                    onPress={() => sendQuestion(item)}
                                    disabled={loading}
                                >
                                    <Feather name="message-circle" size={14} color={theme.colors.primary} />
                                    <Text style={styles.promptChipText} numberOfLines={1}>
                                        {item.length > 35 ? item.substring(0, 35) + "..." : item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* MODAL THƯ VIỆN CÂU HỎI */}
                <Modal
                    visible={isLibraryVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setLibraryVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Thư viện Câu hỏi AI</Text>
                                <TouchableOpacity onPress={() => setLibraryVisible(false)} style={styles.closeModalButton}>
                                    <Feather name="x" size={24} color={theme.colors.foreground} />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView style={styles.modalScroll}>
                                {PROMPT_CATEGORIES.map((category, index) => {
                                    const isExpanded = expandedCategoryIndex === index;
                                    return (
                                        <View key={index} style={styles.categoryContainer}>
                                            <TouchableOpacity 
                                                style={styles.categoryHeader} 
                                                onPress={() => setExpandedCategoryIndex(isExpanded ? null : index)}
                                            >
                                                <View style={styles.categoryHeaderLeft}>
                                                    <Feather name={category.icon as any} size={18} color={theme.colors.primary} />
                                                    <Text style={styles.categoryTitle}>{category.title}</Text>
                                                </View>
                                                <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.mutedForeground} />
                                            </TouchableOpacity>
                                            
                                            {isExpanded && (
                                                <View style={styles.categoryPromptsList}>
                                                    {category.prompts.map((prompt, pIndex) => (
                                                        <TouchableOpacity
                                                            key={pIndex}
                                                            style={styles.modalPromptItem}
                                                            onPress={() => {
                                                                setLibraryVisible(false);
                                                                sendQuestion(prompt);
                                                            }}
                                                        >
                                                            <Feather name="corner-down-right" size={14} color={theme.colors.mutedForeground} />
                                                            <Text style={styles.modalPromptText}>{prompt}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

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
                            
                            {message.role === "assistant" && (message.rows || message.chartType) ? (
                                <AiVisualization rows={message.rows} chartType={message.chartType} />
                            ) : null}

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
    promptToggleBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    promptToggleBtnText: {
        flex: 1,
        fontSize: 13,
        fontWeight: "600",
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
        maxWidth: "100%",
    },
    libraryChip: {
        backgroundColor: theme.colors.primary,
    },
    libraryChipText: {
        fontSize: 13,
        color: "#fff",
        fontWeight: "700",
    },
    promptChipText: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: "600",
        flexShrink: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: "80%",
        padding: theme.spacing.md,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        marginBottom: theme.spacing.sm,
    },
    modalTitle: {
        ...theme.typography.h3,
        color: theme.colors.foreground,
    },
    closeModalButton: {
        padding: 4,
    },
    modalScroll: {
        flex: 1,
    },
    categoryContainer: {
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: "hidden",
    },
    categoryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
    },
    categoryHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    categoryTitle: {
        ...theme.typography.label,
        fontSize: 15,
        color: theme.colors.foreground,
    },
    categoryPromptsList: {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        gap: 8,
    },
    modalPromptItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        backgroundColor: theme.colors.background,
        padding: 12,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    modalPromptText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.foreground,
        lineHeight: 20,
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
    visualizationContainer: {
        marginTop: 12,
        gap: 12,
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    chartStyle: {
        marginVertical: 8,
        borderRadius: 8,
    }
});

