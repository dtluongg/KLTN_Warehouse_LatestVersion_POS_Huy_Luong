import * as React from "react";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
    Pressable,
    ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { EmptyState, ScreenHeader, SearchBar } from "./ui";
import { useResponsive } from "../utils/responsive";
import { useTablePagination } from "../hooks/useTablePagination";
import { useTheme } from "../hooks/useTheme";
import { Typography } from "./ui/Typography";

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
    createAction?: {
        label: string;
        onPress: () => void;
    };
    rowActions?: Array<{
        label: string;
        onPress: (row: any) => void | Promise<void>;
        tone?: "primary" | "neutral" | "danger";
        showOnDesktop?: boolean;
        showOnMobile?: boolean;
        shouldShow?: (row: any) => boolean;
    }>;
    hideDefaultDetailAction?: boolean;
    renderDetailContent?: (row: any) => React.ReactNode;
    renderFilters?: (
        setFilters: (filters: Record<string, any>) => void,
        currentFilters: Record<string, any>,
    ) => React.ReactNode;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: "rgba(245, 158, 11, 0.15)", text: "#92400e" },
    POSTED: { bg: "rgba(16, 185, 129, 0.15)", text: "#065f46" },
    CANCELLED: { bg: "rgba(239, 68, 68, 0.15)", text: "#991b1b" },
    PENDING: { bg: "rgba(59, 130, 246, 0.15)", text: "#1e40af" },
    NOT_RECEIVED: { bg: "rgba(148, 163, 184, 0.2)", text: "#334155" },
    PARTIALLY_RECEIVED: { bg: "rgba(245, 158, 11, 0.15)", text: "#92400e" },
    FULLY_RECEIVED: { bg: "rgba(16, 185, 129, 0.15)", text: "#065f46" },
    ACTIVE: { bg: "rgba(20, 184, 166, 0.15)", text: "#0f766e" },
    INACTIVE: { bg: "rgba(100, 116, 139, 0.15)", text: "#475569" },
};

export const StatusBadge = ({ status }: { status: string }) => {
    const colors = STATUS_COLORS[status] || { bg: "rgba(100, 116, 139, 0.15)", text: "#475569" };
    
    return (
        <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.text, marginRight: 6 }} />
            <Typography variant="body" style={{ color: colors.text, fontWeight: "600", textTransform: "capitalize" }}>
                {status.toLowerCase()}
            </Typography>
        </View>
    );
};

export const formatMoney = (v: any) => {
    if (v == null) return "-";
    const num = typeof v === "number" ? v : parseFloat(v);
    if (isNaN(num)) return "-";
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
};

const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
};

const getTextValue = (value: any): string => {
    if (value == null) return "-";
    return String(value);
};

const DataTableScreen: React.FC<DataTableScreenProps> = ({
    apiUrl,
    columns,
    title = "Danh sách",
    idField = "id",
    searchPlaceholder = "Tìm kiếm...",
    mobilePreviewCount = 5,
    createAction,
    rowActions = [],
    hideDefaultDetailAction = false,
    renderFilters,
    renderDetailContent,
}) => {
    const tablePagination = useTablePagination(apiUrl);
    const { colors, metrics } = useTheme();
    const {
        data,
        loading,
        refreshing,
        pageState,
        totalElements,
        totalPages,
        setPage,
        setSort,
        search,
        refresh,
    } = tablePagination;

    const [searchInput, setSearchInput] = useState("");
    const [selectedRow, setSelectedRow] = useState<any | null>(null);
    const [showFilters, setShowFilters] = useState(true); // Default show filters in SaaS layout

    const { isDesktop } = useResponsive();

    const handleSearchSubmit = () => {
        search(searchInput);
    };

    const handleSort = (colKey: string) => {
        setSort(colKey);
    };

    const refreshRef = React.useRef(refresh);
    React.useEffect(() => {
        refreshRef.current = refresh;
    }, [refresh]);

    useFocusEffect(
        React.useCallback(() => {
            refreshRef.current();
        }, []),
    );

    const handleRowAction = async (
        action: NonNullable<DataTableScreenProps["rowActions"]>[number],
        row: any,
    ) => {
        try {
            await action.onPress(row);
            setSelectedRow(null);
            refresh();
        } catch (error) {
            console.error(`Row action failed for ${action.label}`, error);
        }
    };

    const hasActionColumn =
        !hideDefaultDetailAction ||
        rowActions.some((a) => a.showOnDesktop !== false);

    const renderPaginationFooter = () => {
        const pages = [];
        const start = Math.max(0, pageState.page - 1);
        const end = Math.min(totalPages - 1, pageState.page + 1);
        for(let i=start; i<=end; i++) pages.push(i);

        return (
            <View style={[styles.paginationFooter, { borderColor: "transparent", flexDirection: isDesktop ? "row" : "column", gap: isDesktop ? 0 : 16 }]}>
                <Typography variant="body" color={colors.textSecondary}>
                    Hiển thị {data.length > 0 ? pageState.page * 20 + 1 : 0} đến {Math.min((pageState.page + 1) * 20, totalElements)} trong tổng {totalElements} kết quả
                </Typography>
                <View style={styles.paginationActions}>
                    <TouchableOpacity
                        style={[styles.pageButton]}
                        disabled={pageState.page === 0}
                        onPress={() => setPage(pageState.page - 1)}
                    >
                        <Feather name="chevron-left" size={14} color={pageState.page === 0 ? colors.textDisabled : colors.textPrimary} />
                        {isDesktop && <Typography variant="captionBold" color={pageState.page === 0 ? colors.textDisabled : colors.textPrimary}>Trước</Typography>}
                    </TouchableOpacity>

                    {pages.map(p => (
                        <TouchableOpacity key={p} style={[styles.pageCircle, p === pageState.page && {backgroundColor: colors.primary}]} onPress={() => setPage(p)}>
                            <Typography variant="captionBold" color={p === pageState.page ? colors.buttonText : colors.textPrimary}>{p + 1}</Typography>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={[styles.pageButton]}
                        disabled={pageState.page >= totalPages - 1}
                        onPress={() => setPage(pageState.page + 1)}
                    >
                        {isDesktop && <Typography variant="captionBold" color={pageState.page >= totalPages - 1 ? colors.textDisabled : colors.textPrimary}>Sau</Typography>}
                        <Feather name="chevron-right" size={14} color={pageState.page >= totalPages - 1 ? colors.textDisabled : colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderMobileCards = () => (
        <FlatList
            data={data}
            keyExtractor={(item, index) => String(item[idField] ?? index)}
            contentContainerStyle={styles.mobileListContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
            renderItem={({ item }: { item: any }) => {
                const previewCols = columns.slice(0, mobilePreviewCount);
                return (
                    <TouchableOpacity
                        style={[styles.mobileCard, { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" }]}
                        onPress={() => setSelectedRow(item)}
                        activeOpacity={0.7}
                    >
                        {previewCols.map((col, index) => (
                            <View key={col.key} style={[styles.cardRow, index !== previewCols.length - 1 && { borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.03)" }]}>
                                <Typography variant="body" color={colors.textSecondary} style={{ width: "40%" }}>
                                    {col.label}
                                </Typography>
                                <View style={styles.cardValueBox}>
                                    {col.render ? (
                                        col.render(getNestedValue(item, col.key), item)
                                    ) : (
                                        <Typography variant="bodyEmphasized" color={colors.textPrimary} numberOfLines={2} style={{ textAlign: "right" }}>
                                            {getTextValue(getNestedValue(item, col.key))}
                                        </Typography>
                                    )}
                                </View>
                            </View>
                        ))}
                    </TouchableOpacity>
                );
            }}
            ListEmptyComponent={<EmptyState title="No content here" />}
            ListFooterComponent={renderPaginationFooter}
        />
    );

    const renderDesktopTable = () => (
        <View style={[styles.tableIsland, { backgroundColor: colors.surface, borderRadius: 32, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 30, elevation: 10, marginHorizontal: isDesktop ? 24 : 16, padding: isDesktop ? 16 : 8 }]}>
            <View style={[styles.tableHeaderRow, { borderBottomWidth: 0, paddingHorizontal: isDesktop ? 24 : 16 }]}>
                {columns.map((col) => (
                    <TouchableOpacity
                        key={col.key}
                        style={[col.width ? { width: col.width } : { flex: col.flex || 1 }]}
                        onPress={() => handleSort(col.key)}
                        activeOpacity={0.6}
                    >
                        <Typography variant="micro" color={colors.textSecondary} style={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: "600" }}>{col.label}</Typography>
                    </TouchableOpacity>
                ))}
                {hasActionColumn && (
                    <View style={[{ width: 40 }]} />
                )}
            </View>

            <FlatList
                data={data}
                keyExtractor={(item, index) => String(item[idField] ?? index)}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
                renderItem={({ item }: { item: any }) => (
                    <TouchableOpacity 
                        style={[styles.tableRow, { borderBottomWidth: 0, paddingVertical: 14, paddingHorizontal: isDesktop ? 24 : 16 }]} 
                        activeOpacity={0.7}
                        onPress={() => setSelectedRow(item)}
                    >
                        {columns.map((col) => (
                            <View key={col.key} style={[col.width ? { width: col.width } : { flex: col.flex || 1 }, { justifyContent: "center" }]}>
                                {col.render ? col.render(getNestedValue(item, col.key), item) : (
                                    <Typography variant="body" color={colors.textPrimary} numberOfLines={1}>
                                        {getTextValue(getNestedValue(item, col.key))}
                                    </Typography>
                                )}
                            </View>
                        ))}
                        {hasActionColumn && (
                            <View style={[{ width: 40, alignItems: "flex-end", justifyContent: "center" }]}>
                                <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                            </View>
                        )}
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<EmptyState title="Không có dữ liệu" />}
            />
            {renderPaginationFooter()}
        </View>
    );

    const renderSidebarModal = () => (
        <Modal visible={selectedRow !== null} transparent animationType={isDesktop ? "none" : "slide"} onRequestClose={() => setSelectedRow(null)}>
            <View style={[styles.modalOverlay, !isDesktop && styles.modalOverlayBottomSheet, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <Pressable style={styles.modalBackdrop} onPress={() => setSelectedRow(null)} />
                <View style={[styles.sidebarBox, !isDesktop && { height: "90%", width: "100%", borderTopLeftRadius: 32, borderTopRightRadius: 32 }, { backgroundColor: colors.surface }]}>
                    <View style={[styles.modalHeader, { borderColor: colors.border, borderBottomWidth: 0 }]}>
                        <Typography variant="heading2" color={colors.textPrimary}>Thông tin chi tiết</Typography>
                        <TouchableOpacity style={{ padding: 8, backgroundColor: colors.background, borderRadius: 20 }} onPress={() => setSelectedRow(null)}>
                            <Feather name="x" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalList} contentContainerStyle={{ paddingBottom: 40 }}>
                        <View style={styles.autoDetailSection}>
                            {columns.map((col) => (
                                <View key={col.key} style={[styles.modalRow, { borderBottomColor: "rgba(0,0,0,0.03)" }]}>
                                    <Typography variant="body" color={colors.textSecondary} style={{ width: "40%" }}>{col.label}</Typography>
                                    <View style={styles.modalValueBox}>
                                        {col.render && selectedRow ? col.render(getNestedValue(selectedRow, col.key), selectedRow) : (
                                            <Typography variant="bodyEmphasized" color={colors.textPrimary} style={{ textAlign: "right" }}>
                                                {selectedRow ? getTextValue(getNestedValue(selectedRow, col.key)) : "-"}
                                            </Typography>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                        {renderDetailContent && selectedRow && (
                            <View style={styles.customDetailWrap}>{renderDetailContent(selectedRow)}</View>
                        )}
                    </ScrollView>

                    {selectedRow && rowActions.length > 0 && (
                        <View style={[styles.modalActionsWrap, { backgroundColor: colors.surface }]}>
                            {rowActions.filter((a) => !a.shouldShow || a.shouldShow(selectedRow)).map((action, i) => {
                                const isDanger = action.tone === "danger";
                                const isNeutral = action.tone === "neutral";
                                const bg = isDanger ? "rgba(239, 68, 68, 0.1)" : isNeutral ? colors.background : colors.primary;
                                const textC = isDanger ? colors.danger : isNeutral ? colors.textPrimary : colors.buttonText;
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.rowActionButtonModal, { backgroundColor: bg, borderRadius: 99 }]}
                                        onPress={() => handleRowAction(action, selectedRow)}
                                    >
                                        <Typography variant="bodyEmphasized" color={textC}>{action.label}</Typography>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={[{ flex: 1, backgroundColor: colors.background }]}>
            <View style={styles.topSection}>
                <ScreenHeader
                    title={title}
                    subtitle=""
                    rightSlot={
                        <View style={styles.rightHeaderWrap}>
                            {isDesktop && (
                                <View style={{ width: 300, marginRight: 16 }}>
                                    <SearchBar
                                        value={searchInput}
                                        onChangeText={setSearchInput}
                                        placeholder={searchPlaceholder}
                                    />
                                </View>
                            )}
                            {createAction && (
                                <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary, borderRadius: 99 }]} onPress={createAction.onPress}>
                                    <Typography variant="bodyEmphasized" color={colors.buttonText}>{createAction.label}</Typography>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />

                {!isDesktop && (
                    <View style={{ paddingBottom: 16, flexDirection: "row", gap: 8, paddingHorizontal: 16 }}>
                        <View style={{ flex: 1 }}>
                            <SearchBar
                                value={searchInput}
                                onChangeText={setSearchInput}
                                placeholder={searchPlaceholder}
                            />
                        </View>
                        {renderFilters && (
                            <TouchableOpacity style={[styles.filterMobileBtn, { backgroundColor: "rgba(0, 113, 227, 0.08)" }]} onPress={() => setShowFilters(!showFilters)}>
                                <Feather name="filter" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {showFilters && renderFilters && (
                    <View style={[styles.filterPanel]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                            {renderFilters(tablePagination.setFilters, pageState.filters || {})}
                        </ScrollView>
                    </View>
                )}
            </View>

            {loading && data.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : isDesktop ? (
                renderDesktopTable()
            ) : (
                renderMobileCards()
            )}

            {renderSidebarModal()}
        </View>
    );
};

export default DataTableScreen;

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    topSection: { paddingHorizontal: 16, paddingBottom: 16 },
    searchWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
    searchButton: { justifyContent: "center", alignItems: "center", paddingHorizontal: 16 },
    filterPanel: { paddingHorizontal: 16, paddingBottom: 16 },
    rightHeaderWrap: { flexDirection: "row", alignItems: "center" },
    createButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12 },
    
    // Island UI
    tableIsland: { flex: 1, marginBottom: 24, overflow: "hidden" },
    tableHeaderRow: { flexDirection: "row", paddingVertical: 16 },
    tableRow: { flexDirection: "row", marginVertical: 4 },
    
    filterMobileBtn: { height: 48, width: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },

    mobileListContent: { padding: 16 },
    mobileCard: { paddingHorizontal: 16, paddingVertical: 8, marginBottom: 12 },
    cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
    cardValueBox: { flex: 1, alignItems: "flex-end" },
    
    // Pagination
    paginationFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 20 },
    paginationActions: { flexDirection: "row", gap: 6, alignItems: "center" },
    pageButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
    pageCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    
    rowActionButtonModal: { flex: 1, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
    modalOverlay: { flex: 1, flexDirection: "row", justifyContent: "flex-end" },
    modalOverlayBottomSheet: { flexDirection: "column", justifyContent: "flex-end" },
    modalBackdrop: { ...StyleSheet.absoluteFillObject },
    sidebarBox: { width: 500, maxWidth: "100%", height: "100%", elevation: 20, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 30 },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 24 },
    modalList: { flex: 1 },
    autoDetailSection: { paddingHorizontal: 24, paddingTop: 10 },
    customDetailWrap: { paddingHorizontal: 24, paddingBottom: 24 },
    modalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderStyle: "solid" },
    modalValueBox: { flex: 1, alignItems: "flex-end", justifyContent: "center" },
    modalActionsWrap: { flexDirection: "row", gap: 16, padding: 24 }
});
