import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { axiosClient } from "../api/axiosClient";
import { EmptyState, ScreenHeader, SearchBar } from "./ui";
import { theme } from "../utils/theme";
import { useResponsive } from "../utils/responsive";

export interface Column {
    key: string;
    label: string;
    flex?: number;
    width?: number;
    render?: (value: any, row: any) => React.ReactNode;
}

export interface DataTableScreenProps {
    apiUrl: string;
    columns: Column[];
    title?: string;
    idField?: string;
    searchPlaceholder?: string;
    mobilePreviewCount?: number;
    detailActionLabel?: string;
    createAction?: {
        label: string;
        onPress: () => void;
    };
    rowActions?: Array<{
        label: string;
        onPress: (row: any) => void;
        tone?: "primary" | "neutral" | "danger";
        showOnDesktop?: boolean;
        showOnMobile?: boolean;
        shouldShow?: (row: any) => boolean;
    }>;
    hideDefaultDetailAction?: boolean;
    showDefaultDetailOnDesktop?: boolean;
    showDefaultDetailOnMobile?: boolean;
    mobileCardPressToDetail?: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: "#fef3c7", text: "#92400e" },
    POSTED: { bg: "#d1fae5", text: "#065f46" },
    COMPLETED: { bg: "#d1fae5", text: "#065f46" },
    CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
    PENDING: { bg: "#dbeafe", text: "#1e40af" },
    ACTIVE: { bg: "#d1fae5", text: "#065f46" },
    INACTIVE: { bg: "#f3f4f6", text: "#6b7280" },
};

export const StatusBadge = ({ status }: { status: string }) => {
    const colors = STATUS_COLORS[status] || { bg: "#f3f4f6", text: "#374151" };
    return (
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
                {status}
            </Text>
        </View>
    );
};

export const formatMoney = (v: any) => {
    if (v == null) return "-";
    const num = typeof v === "number" ? v : parseFloat(v);
    if (isNaN(num)) return "-";
    return `${num.toLocaleString("vi-VN")}d`;
};

const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
};

const getTextValue = (value: any): string => {
    if (value == null) return "-";
    return String(value);
};

const normalizeRenderedTextNode = (
    node: React.ReactNode,
    textStyle: any,
): React.ReactNode => {
    if (node == null || typeof node === "boolean") {
        return <Text style={textStyle}>-</Text>;
    }

    if (typeof node === "string" || typeof node === "number") {
        return <Text style={textStyle}>{String(node)}</Text>;
    }

    if (React.isValidElement(node) && node.type === React.Fragment) {
        const children = (node.props as { children?: unknown })?.children;
        if (typeof children === "string" || typeof children === "number") {
            return <Text style={textStyle}>{String(children)}</Text>;
        }
        if (
            Array.isArray(children) &&
            children.every(
                (child) =>
                    typeof child === "string" || typeof child === "number",
            )
        ) {
            return <Text style={textStyle}>{children.join("")}</Text>;
        }
    }

    return node;
};

const getActionToneStyle = (tone?: "primary" | "neutral" | "danger") => {
    switch (tone) {
        case "danger":
            return {
                button: styles.rowActionButtonDanger,
                text: styles.rowActionTextDanger,
            };
        case "neutral":
            return {
                button: styles.rowActionButtonNeutral,
                text: styles.rowActionTextNeutral,
            };
        default:
            return {
                button: styles.rowActionButtonPrimary,
                text: styles.rowActionTextPrimary,
            };
    }
};

const MOBILE_COMPACT_DEFAULT_COUNT = 8;

const getMobileFieldPriorityScore = (column: Column): number => {
    const key = column.key.toLowerCase();
    const label = column.label.toLowerCase();
    const haystack = `${key} ${label}`;

    if (/(^|\.)id$|(^|\.)code$|no$/.test(key)) return 100;
    if (/status|trạng thái/.test(haystack)) return 95;
    if (/netamount|total|amount|tiền|giá|vat|discount|surcharge/.test(haystack))
        return 90;
    if (/date|time|ngày|giờ/.test(haystack)) return 85;
    if (
        /customer|supplier|warehouse|createdby|staff|khách|nhà cung|kho|nhân viên|người tạo/.test(
            haystack,
        )
    )
        return 80;
    if (/payment|channel|thanh toán|kênh/.test(haystack)) return 75;
    if (/qty|quantity|sl/.test(haystack)) return 70;
    if (/note|ghi chú|reason|lý do/.test(haystack)) return 20;
    return 60;
};

const pickImportantMobileColumns = (
    sourceColumns: Column[],
    maxCount: number,
): Column[] => {
    if (sourceColumns.length <= maxCount) return sourceColumns;
    return sourceColumns
        .map((col, index) => ({
            col,
            index,
            score: getMobileFieldPriorityScore(col),
        }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.index - b.index;
        })
        .slice(0, maxCount)
        .sort((a, b) => a.index - b.index)
        .map((item) => item.col);
};

const DataTableScreen: React.FC<DataTableScreenProps> = ({
    apiUrl,
    columns,
    title = "Danh sách",
    idField = "id",
    searchPlaceholder = "Tìm kiếm...",
    mobilePreviewCount = MOBILE_COMPACT_DEFAULT_COUNT,
    detailActionLabel = "Chi tiết",
    createAction,
    rowActions = [],
    hideDefaultDetailAction = false,
    showDefaultDetailOnDesktop = true,
    showDefaultDetailOnMobile = false,
    mobileCardPressToDetail = false,
}) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedRow, setSelectedRow] = useState<any | null>(null);

    const { isDesktop } = useResponsive();

    const fetchData = async () => {
        try {
            const res = await axiosClient.get(apiUrl);
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (e: any) {
            console.log(`Lỗi tải ${apiUrl}:`, e?.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const filtered = useMemo(() => {
        if (!search.trim()) return data;
        const q = search.toLowerCase();
        return data.filter((row) =>
            columns.some((col) => {
                const v = getNestedValue(row, col.key);
                return v != null && String(v).toLowerCase().includes(q);
            }),
        );
    }, [columns, data, search]);

    const compactMobileColumns = useMemo(
        () =>
            pickImportantMobileColumns(
                columns,
                Math.max(1, mobilePreviewCount),
            ),
        [columns, mobilePreviewCount],
    );

    const shouldShowDefaultDetail =
        !hideDefaultDetailAction &&
        (isDesktop ? showDefaultDetailOnDesktop : showDefaultDetailOnMobile);

    const visibleCustomActions = (row: any) =>
        rowActions.filter((action) => {
            const platformAllowed = isDesktop
                ? action.showOnDesktop !== false
                : action.showOnMobile !== false;
            if (!platformAllowed) return false;
            if (action.shouldShow) return action.shouldShow(row);
            return true;
        });

    const visibleActionsForRow = (row: any) => {
        const actions = [...visibleCustomActions(row)];
        if (shouldShowDefaultDetail) {
            actions.unshift({
                label: detailActionLabel,
                onPress: (targetRow: any) => setSelectedRow(targetRow),
                tone: "primary" as const,
            });
        }
        return actions;
    };

    const hasActionColumn =
        shouldShowDefaultDetail ||
        rowActions.some((action) => action.showOnDesktop !== false);

    const renderMobileValue = (col: Column, row: any) => {
        const rawValue = getNestedValue(row, col.key);
        if (!col.render) {
            return (
                <Text style={styles.cardValue} numberOfLines={1}>
                    {getTextValue(rawValue)}
                </Text>
            );
        }
        return normalizeRenderedTextNode(
            col.render(rawValue, row),
            styles.cardValue,
        );
    };

    const renderRowActions = (row: any) => {
        const actions = visibleActionsForRow(row);
        if (actions.length === 0) return null;
        return (
            <View style={styles.rowActionsWrap}>
                {actions.map((action, actionIndex) => {
                    const toneStyle = getActionToneStyle(action.tone);
                    return (
                        <TouchableOpacity
                            key={`${action.label}-${actionIndex}`}
                            style={[styles.rowActionButton, toneStyle.button]}
                            onPress={() => action.onPress(row)}
                        >
                            <Text
                                style={[styles.rowActionText, toneStyle.text]}
                            >
                                {action.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const renderDetailModal = () => (
        <Modal
            visible={selectedRow != null}
            transparent
            animationType={isDesktop ? "fade" : "slide"}
            onRequestClose={() => setSelectedRow(null)}
        >
            <View
                style={[
                    styles.modalOverlay,
                    !isDesktop && styles.modalOverlayBottomSheet,
                ]}
            >
                <View
                    style={[
                        styles.modalBox,
                        !isDesktop && styles.modalBoxBottomSheet,
                    ]}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chi tiết bản ghi</Text>
                        <TouchableOpacity onPress={() => setSelectedRow(null)}>
                            <Feather
                                name="x"
                                size={18}
                                color={theme.colors.mutedForeground}
                            />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={columns}
                        keyExtractor={(col) => col.key}
                        style={styles.modalList}
                        renderItem={({ item: col }) => (
                            <View style={styles.modalRow}>
                                <Text style={styles.modalLabel}>
                                    {col.label}
                                </Text>
                                <View style={styles.modalValueBox}>
                                    {col.render && selectedRow ? (
                                        col.render(
                                            getNestedValue(
                                                selectedRow,
                                                col.key,
                                            ),
                                            selectedRow,
                                        )
                                    ) : (
                                        <Text style={styles.modalValue}>
                                            {selectedRow
                                                ? getTextValue(
                                                      getNestedValue(
                                                          selectedRow,
                                                          col.key,
                                                      ),
                                                  )
                                                : "-"}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}
                    />

                    {selectedRow ? (
                        <View style={styles.modalActionsWrap}>
                            {visibleCustomActions(selectedRow).map(
                                (action, actionIndex) => {
                                    const toneStyle = getActionToneStyle(
                                        action.tone,
                                    );
                                    return (
                                        <TouchableOpacity
                                            key={`${action.label}-${actionIndex}`}
                                            style={[
                                                styles.rowActionButton,
                                                toneStyle.button,
                                            ]}
                                            onPress={() =>
                                                action.onPress(selectedRow)
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.rowActionText,
                                                    toneStyle.text,
                                                ]}
                                            >
                                                {action.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                },
                            )}
                        </View>
                    ) : null}
                </View>
            </View>
        </Modal>
    );

    const renderDesktopTable = () => (
        <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRow}>
                {columns.map((col) => (
                    <View
                        key={col.key}
                        style={[
                            styles.tableHeaderCell,
                            col.width
                                ? { width: col.width }
                                : { flex: col.flex || 1 },
                        ]}
                    >
                        <Text style={styles.tableHeaderText}>{col.label}</Text>
                    </View>
                ))}
                {hasActionColumn ? (
                    <View style={[styles.tableHeaderCell, { width: 180 }]}>
                        <Text style={styles.tableHeaderText}>Hành động</Text>
                    </View>
                ) : null}
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item, index) => String(item[idField] ?? index)}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary]}
                    />
                }
                renderItem={({ item, index }) => (
                    <View
                        style={[
                            styles.tableRow,
                            index % 2 === 0 && styles.tableRowEven,
                        ]}
                    >
                        {columns.map((col) => (
                            <View
                                key={col.key}
                                style={[
                                    styles.tableCell,
                                    col.width
                                        ? { width: col.width }
                                        : { flex: col.flex || 1 },
                                ]}
                            >
                                {col.render ? (
                                    col.render(
                                        getNestedValue(item, col.key),
                                        item,
                                    )
                                ) : (
                                    <Text
                                        style={styles.tableCellText}
                                        numberOfLines={1}
                                    >
                                        {getTextValue(
                                            getNestedValue(item, col.key),
                                        )}
                                    </Text>
                                )}
                            </View>
                        ))}
                        {hasActionColumn ? (
                            <View style={[styles.tableCell, { width: 180 }]}>
                                {renderRowActions(item)}
                            </View>
                        ) : null}
                    </View>
                )}
                ListEmptyComponent={<EmptyState title="Không có dữ liệu" />}
            />
        </View>
    );

    const hiddenMobileFieldCount = columns.length - compactMobileColumns.length;

    const renderMobileCards = () => (
        <FlatList
            data={filtered}
            keyExtractor={(item, index) => String(item[idField] ?? index)}
            contentContainerStyle={styles.mobileListContent}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[theme.colors.primary]}
                />
            }
            renderItem={({ item }) => (
                <View style={styles.card}>
                    {compactMobileColumns.map((col) => (
                        <View key={col.key} style={styles.cardRow}>
                            <Text style={styles.cardLabel}>{col.label}</Text>
                            <View style={styles.cardValueBox}>
                                {renderMobileValue(col, item)}
                            </View>
                        </View>
                    ))}

                    {hiddenMobileFieldCount > 0 ? (
                        <TouchableOpacity
                            style={styles.viewMoreButton}
                            onPress={() => setSelectedRow(item)}
                        >
                            <Text style={styles.viewMoreButtonText}>
                                Xem thêm ({hiddenMobileFieldCount} trường)
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                    <View style={styles.cardActionWrap}>
                        {renderRowActions(item)}
                    </View>

                    {mobileCardPressToDetail && shouldShowDefaultDetail ? (
                        <TouchableOpacity
                            style={styles.cardTapHintButton}
                            onPress={() => setSelectedRow(item)}
                        >
                            <Text style={styles.cardTapHintText}>
                                Chạm để xem chi tiết
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            )}
            ListEmptyComponent={<EmptyState title="Không có dữ liệu" />}
        />
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader
                title={title}
                subtitle={`${filtered.length} bản ghi`}
                rightSlot={
                    <View style={styles.rightHeaderWrap}>
                        {createAction ? (
                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={createAction.onPress}
                            >
                                <Feather
                                    name="plus"
                                    size={14}
                                    color={theme.colors.primaryForeground}
                                />
                                <Text style={styles.createButtonText}>
                                    {createAction.label}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>
                                {filtered.length}
                            </Text>
                        </View>
                    </View>
                }
            />

            <View style={styles.searchWrapper}>
                <SearchBar
                    value={search}
                    onChangeText={setSearch}
                    placeholder={searchPlaceholder}
                />
            </View>

            {isDesktop ? renderDesktopTable() : renderMobileCards()}

            {renderDetailModal()}
        </View>
    );
};

export default DataTableScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    loadingText: {
        color: theme.colors.mutedForeground,
        fontSize: 14,
    },
    searchWrapper: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
    },
    countBadge: {
        minWidth: 34,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primaryLight,
        borderWidth: 1,
        borderColor: "#a7f3d0",
    },
    countText: {
        color: theme.colors.primary,
        fontSize: 12,
        fontWeight: "700",
    },
    rightHeaderWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    createButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    createButtonText: {
        color: theme.colors.primaryForeground,
        fontSize: 12,
        fontWeight: "700",
    },

    tableContainer: {
        flex: 1,
    },
    tableHeaderRow: {
        flexDirection: "row",
        backgroundColor: theme.colors.surfaceRaised,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
    },
    tableHeaderCell: {
        paddingHorizontal: 8,
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: "700",
        color: theme.colors.mutedForeground,
        textTransform: "uppercase",
    },
    tableRow: {
        flexDirection: "row",
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        alignItems: "center",
        backgroundColor: theme.colors.surface,
    },
    tableRowEven: {
        backgroundColor: "#f8fafc",
    },
    tableCell: {
        paddingHorizontal: 8,
    },
    tableCellText: {
        fontSize: 13,
        color: theme.colors.foreground,
    },

    mobileListContent: {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 10,
        paddingVertical: 4,
    },
    cardLabel: {
        fontSize: 12,
        color: theme.colors.mutedForeground,
        fontWeight: "600",
        width: "42%",
    },
    cardValueBox: {
        flex: 1,
        alignItems: "flex-end",
    },
    cardValue: {
        fontSize: 13,
        color: theme.colors.foreground,
        fontWeight: "600",
        textAlign: "right",
    },
    moreHint: {
        marginTop: 6,
        fontSize: 11,
        color: theme.colors.mutedForeground,
        textAlign: "right",
    },
    viewMoreButton: {
        marginTop: 8,
        alignSelf: "flex-end",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceRaised,
    },
    viewMoreButtonText: {
        fontSize: 11,
        fontWeight: "700",
        color: theme.colors.foreground,
    },
    cardActionWrap: {
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    cardTapHintButton: {
        marginTop: 8,
        alignSelf: "flex-end",
    },
    cardTapHintText: {
        fontSize: 11,
        fontWeight: "600",
        color: theme.colors.mutedForeground,
    },

    rowActionsWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
    },
    rowActionButton: {
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    rowActionText: {
        fontSize: 11,
        fontWeight: "700",
    },
    rowActionButtonPrimary: {
        borderColor: "#a7f3d0",
        backgroundColor: theme.colors.primaryLight,
    },
    rowActionTextPrimary: {
        color: theme.colors.primary,
    },
    rowActionButtonNeutral: {
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceRaised,
    },
    rowActionTextNeutral: {
        color: theme.colors.foreground,
    },
    rowActionButtonDanger: {
        borderColor: "#fecaca",
        backgroundColor: "#fef2f2",
    },
    rowActionTextDanger: {
        color: theme.colors.error,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: "center",
        paddingHorizontal: theme.spacing.md,
    },
    modalOverlayBottomSheet: {
        justifyContent: "flex-end",
        paddingHorizontal: 0,
    },
    modalBox: {
        maxHeight: "80%",
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 10,
    },
    modalBoxBottomSheet: {
        maxHeight: "88%",
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        paddingBottom: theme.spacing.lg,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    modalTitle: {
        ...theme.typography.title,
        color: theme.colors.foreground,
    },
    modalList: {
        maxHeight: 380,
    },
    modalRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalLabel: {
        width: "38%",
        fontSize: 12,
        color: theme.colors.mutedForeground,
        fontWeight: "600",
    },
    modalValueBox: {
        flex: 1,
        alignItems: "flex-end",
    },
    modalValue: {
        fontSize: 13,
        color: theme.colors.foreground,
        textAlign: "right",
    },
    modalActionsWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
    },

    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        alignSelf: "flex-end",
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700",
    },
});
