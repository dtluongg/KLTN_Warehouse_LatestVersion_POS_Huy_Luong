import * as React from "react";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Pressable,
    ScrollView
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { EmptyState, ScreenHeader, SearchBar } from "./ui";
import { theme } from "../utils/theme";
import { useResponsive } from "../utils/responsive";
import { useTablePagination } from "../hooks/useTablePagination";

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
        onPress: (row: any) => void;
        tone?: "primary" | "neutral" | "danger";
        showOnDesktop?: boolean;
        showOnMobile?: boolean;
        shouldShow?: (row: any) => boolean;
    }>;
    hideDefaultDetailAction?: boolean;
    renderDetailContent?: (row: any) => React.ReactNode; 
    renderFilters?: (setFilters: (filters: Record<string, any>) => void, currentFilters: Record<string, any>) => React.ReactNode;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    DRAFT: { bg: "#fef3c7", text: "#92400e" },
    POSTED: { bg: "#d1fae5", text: "#065f46" },
    COMPLETED: { bg: "#d1fae5", text: "#065f46" },
    CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
    PENDING: { bg: "#dbeafe", text: "#1e40af" },
    ACTIVE: { bg: "#ccfbf1", text: "#0f766e" },
    INACTIVE: { bg: "#f1f5f9", text: "#64748b" },
};

export const StatusBadge = ({ status }: { status: string }) => {
    const colors = STATUS_COLORS[status] || { bg: "#f1f5f9", text: "#475569" };
    return (
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{status}</Text>
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

const getActionToneStyle = (tone?: "primary" | "neutral" | "danger") => {
    switch (tone) {
        case "danger":
            return { button: styles.rowActionButtonDanger, text: styles.rowActionTextDanger };
        case "neutral":
            return { button: styles.rowActionButtonNeutral, text: styles.rowActionTextNeutral };
        default:
            return { button: styles.rowActionButtonPrimary, text: styles.rowActionTextPrimary };
    }
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
    renderDetailContent
}) => {
    const tablePagination = useTablePagination(apiUrl);
    const {
        data, loading, refreshing,
        pageState, totalElements, totalPages,
        setPage, setSize, setSort, search, refresh
    } = tablePagination;

    const [searchInput, setSearchInput] = useState("");
    const [selectedRow, setSelectedRow] = useState<any | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const { isDesktop } = useResponsive();

    // Prevent immediate API firing on every keystroke
    const handleSearchSubmit = () => {
        search(searchInput);
    };

    const handleSort = (colKey: string) => {
        setSort(colKey);
    };

    const hasActionColumn = !hideDefaultDetailAction || rowActions.some((a) => a.showOnDesktop !== false);

    const renderPaginationFooter = () => {
        return (
            <View style={styles.paginationFooter}>
                <Text style={styles.paginationText}>
                    Tổng {totalElements} | Trang {pageState.page + 1}/{Math.max(1, totalPages)}
                </Text>
                <View style={styles.paginationActions}>
                    <TouchableOpacity 
                        style={[styles.pageButton, pageState.page === 0 && styles.pageButtonDisabled]}
                        disabled={pageState.page === 0}
                        onPress={() => setPage(pageState.page - 1)}
                    >
                        <Feather name="chevron-left" size={16} color={pageState.page === 0 ? theme.colors.mutedForeground : theme.colors.foreground} />
                        {!isDesktop ? null : <Text style={styles.pageButtonText}>Trước</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.pageButton, pageState.page >= totalPages - 1 && styles.pageButtonDisabled]}
                        disabled={pageState.page >= totalPages - 1}
                        onPress={() => setPage(pageState.page + 1)}
                    >
                        {!isDesktop ? null : <Text style={styles.pageButtonText}>Sau</Text>}
                        <Feather name="chevron-right" size={16} color={pageState.page >= totalPages - 1 ? theme.colors.mutedForeground : theme.colors.foreground} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const renderMobileCards = () => (
        <FlatList
            data={data}
            keyExtractor={(item, index) => String(item[idField] ?? index)}
            contentContainerStyle={styles.mobileListContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.colors.primary]} />}
            renderItem={({ item }) => {
                const previewCols = columns.slice(0, mobilePreviewCount);
                return (
                    <TouchableOpacity 
                        style={styles.mobileCard}
                        onPress={() => setSelectedRow(item)}
                        activeOpacity={0.7}
                    >
                        {previewCols.map((col) => (
                            <View key={col.key} style={styles.cardRow}>
                                <Text style={styles.cardLabel}>{col.label}</Text>
                                <View style={styles.cardValueBox}>
                                    {col.render ? col.render(getNestedValue(item, col.key), item) : (
                                        <Text style={styles.cardValue} numberOfLines={1}>
                                            {getTextValue(getNestedValue(item, col.key))}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </TouchableOpacity>
                );
            }}
            ListEmptyComponent={<EmptyState title="Không có dữ liệu" />}
            ListFooterComponent={renderPaginationFooter}
        />
    );

    const renderDesktopTable = () => (
        <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRow}>
                {columns.map((col) => (
                    <TouchableOpacity
                        key={col.key}
                        style={[styles.tableHeaderCell, col.width ? { width: col.width } : { flex: col.flex || 1 }]}
                        onPress={() => handleSort(col.key)}
                        activeOpacity={0.6}
                    >
                        <Text style={styles.tableHeaderText}>{col.label}</Text>
                        {pageState.sortBy === col.key && (
                            <Feather name={pageState.direction === "asc" ? "chevron-up" : "chevron-down"} size={14} color={theme.colors.primary} />
                        )}
                    </TouchableOpacity>
                ))}
                {hasActionColumn && <View style={[styles.tableHeaderCell, { width: 140 }]}><Text style={styles.tableHeaderText}>Hành động</Text></View>}
            </View>

            <FlatList
                data={data}
                keyExtractor={(item, index) => String(item[idField] ?? index)}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.colors.primary]} />}
                renderItem={({ item, index }) => (
                    <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                        {columns.map((col) => (
                            <View key={col.key} style={[styles.tableCell, col.width ? { width: col.width } : { flex: col.flex || 1 }]}>
                                {col.render ? col.render(getNestedValue(item, col.key), item) : (
                                    <Text style={styles.tableCellText} numberOfLines={1}>{getTextValue(getNestedValue(item, col.key))}</Text>
                                )}
                            </View>
                        ))}
                        {hasActionColumn && (
                            <View style={[styles.tableCell, { width: 140, flexDirection: 'row', gap: 8 }]}>
                                {!hideDefaultDetailAction && (
                                    <TouchableOpacity style={[styles.rowActionButton, styles.rowActionButtonPrimary]} onPress={() => setSelectedRow(item)}>
                                        <Text style={[styles.rowActionText, styles.rowActionTextPrimary]}>Mở</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={<EmptyState title="Không có dữ liệu" />}
            />
            {renderPaginationFooter()}
        </View>
    );

    const renderSidebarModal = () => (
        <Modal
            visible={selectedRow !== null}
            transparent
            animationType={isDesktop ? "none" : "slide"}
            onRequestClose={() => setSelectedRow(null)}
        >
            <View style={[styles.modalOverlay, !isDesktop && styles.modalOverlayBottomSheet]}>
                <Pressable style={styles.modalBackdrop} onPress={() => setSelectedRow(null)} />
                <View style={[styles.sidebarBox, !isDesktop && styles.sidebarBoxMobile]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chi tiết bản ghi</Text>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedRow(null)}>
                            <Feather name="x" size={20} color={theme.colors.foreground} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalList} contentContainerStyle={{ paddingBottom: 40 }}>
                        {/* Auto-render basic info */}
                        <View style={styles.autoDetailSection}>
                            {columns.map((col) => (
                                <View key={col.key} style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>{col.label}</Text>
                                    <View style={styles.modalValueBox}>
                                        {col.render && selectedRow ? col.render(getNestedValue(selectedRow, col.key), selectedRow) : (
                                            <Text style={styles.modalValue}>{selectedRow ? getTextValue(getNestedValue(selectedRow, col.key)) : "-"}</Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                        
                        {/* Custom content mapping like item list */}
                        {renderDetailContent && selectedRow && (
                            <View style={styles.customDetailWrap}>
                                {renderDetailContent(selectedRow)}
                            </View>
                        )}
                    </ScrollView>

                    {/* Actions bar */}
                    {selectedRow && rowActions.length > 0 && (
                        <View style={styles.modalActionsWrap}>
                            {rowActions.filter(a => !a.shouldShow || a.shouldShow(selectedRow)).map((action, i) => {
                                const toneStyle = getActionToneStyle(action.tone);
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.rowActionButton, toneStyle.button, { flex: 1, paddingVertical: 12 }]}
                                        onPress={() => action.onPress(selectedRow)}
                                    >
                                        <Text style={[styles.rowActionText, toneStyle.text, { fontSize: 13 }]}>{action.label}</Text>
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
        <View style={styles.container}>
            <ScreenHeader
                title={title}
                subtitle={`Danh sách tự động cập nhật`}
                rightSlot={
                    <View style={styles.rightHeaderWrap}>
                        {createAction && (
                            <TouchableOpacity style={styles.createButton} onPress={createAction.onPress}>
                                <Feather name="plus" size={16} color={theme.colors.primaryForeground} />
                                <Text style={styles.createButtonText}>{createAction.label}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />

            <View style={styles.searchWrapper}>
                <View style={{ flex: 1, flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                        <SearchBar
                            value={searchInput}
                            onChangeText={setSearchInput}
                            placeholder={searchPlaceholder}
                            onSubmitEditing={handleSearchSubmit}
                        />
                    </View>
                    {renderFilters && (
                        <TouchableOpacity style={[styles.searchButton, showFilters && { backgroundColor: theme.colors.primaryDark }]} onPress={() => setShowFilters(!showFilters)}>
                            <Feather name="filter" size={16} color={theme.colors.primaryForeground} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
                        <Feather name="search" size={16} color={theme.colors.primaryForeground} />
                    </TouchableOpacity>
                </View>
                
                {showFilters && renderFilters && (
                    <View style={styles.filterPanel}>
                        {renderFilters(tablePagination.setFilters, pageState.filters || {})}
                    </View>
                )}
            </View>

            {loading && data.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : isDesktop ? renderDesktopTable() : renderMobileCards()}

            {renderSidebarModal()}
        </View>
    );
};

export default DataTableScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    searchWrapper: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
    searchButton: {
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.sm
    },
    filterPanel: {
        marginTop: 12,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.sm
    },
    rightHeaderWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
    createButton: {
        flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 14, paddingVertical: 10,
        ...theme.shadows.sm
    },
    createButtonText: { color: theme.colors.primaryForeground, fontSize: 13, fontWeight: "700" },

    tableContainer: { flex: 1, backgroundColor: theme.colors.surface, margin: theme.spacing.md, borderRadius: theme.borderRadius.lg, ...theme.shadows.md, overflow: 'hidden' },
    tableHeaderRow: { flexDirection: "row", backgroundColor: theme.colors.surfaceRaised, paddingHorizontal: theme.spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderColor: theme.colors.border },
    tableHeaderCell: { paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 6 },
    tableHeaderText: { fontSize: 13, fontWeight: "700", color: theme.colors.foreground, textTransform: "uppercase" },
    tableRow: { flexDirection: "row", paddingHorizontal: theme.spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface },
    tableRowEven: { backgroundColor: "#fafbfc" },
    tableCell: { paddingHorizontal: 8, justifyContent: 'center' },
    tableCellText: { fontSize: 14, color: theme.colors.foreground },

    mobileListContent: { padding: theme.spacing.md },
    mobileCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: 12,
        borderWidth: 1, borderColor: "transparent",
        ...theme.shadows.sm
    },
    cardRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
    cardLabel: { fontSize: 13, color: theme.colors.mutedForeground, fontWeight: "600", width: "40%" },
    cardValueBox: { flex: 1, alignItems: "flex-end" },
    cardValue: { fontSize: 14, color: theme.colors.foreground, fontWeight: "600", textAlign: "right" },

    paginationFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, borderTopWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
    paginationText: { fontSize: 13, color: theme.colors.mutedForeground },
    paginationActions: { flexDirection: 'row', gap: 10 },
    pageButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.surfaceRaised },
    pageButtonDisabled: { opacity: 0.5 },
    pageButtonText: { fontSize: 13, color: theme.colors.foreground, fontWeight: '600' },

    rowActionButton: { alignItems: 'center', justifyContent: 'center', borderRadius: theme.borderRadius.sm, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
    rowActionText: { fontSize: 12, fontWeight: "700" },
    rowActionButtonPrimary: { borderColor: theme.colors.ring, backgroundColor: theme.colors.primaryLight },
    rowActionTextPrimary: { color: theme.colors.primary },
    rowActionButtonNeutral: { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceRaised },
    rowActionTextNeutral: { color: theme.colors.foreground },
    rowActionButtonDanger: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
    rowActionTextDanger: { color: theme.colors.error },

    modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, flexDirection: 'row', justifyContent: "flex-end" },
    modalOverlayBottomSheet: { flexDirection: 'column', justifyContent: "flex-end" },
    modalBackdrop: { ...StyleSheet.absoluteFillObject },
    sidebarBox: { width: 450, maxWidth: '100%', height: '100%', backgroundColor: theme.colors.surface, ...theme.shadows.float },
    sidebarBoxMobile: { height: '85%', width: '100%', borderTopLeftRadius: theme.borderRadius.xl, borderTopRightRadius: theme.borderRadius.xl },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    modalTitle: { ...theme.typography.h3, color: theme.colors.foreground },
    modalCloseBtn: { padding: 8, backgroundColor: theme.colors.surfaceRaised, borderRadius: 20 },
    modalList: { flex: 1 },
    autoDetailSection: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },
    customDetailWrap: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg },
    modalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border, borderStyle: 'dashed' },
    modalLabel: { width: "40%", fontSize: 13, color: theme.colors.mutedForeground, fontWeight: "600" },
    modalValueBox: { flex: 1, alignItems: "flex-end" },
    modalValue: { fontSize: 14, color: theme.colors.foreground, textAlign: "right", fontWeight: "600" },
    modalActionsWrap: { flexDirection: "row", gap: 10, padding: theme.spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface },
    
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-end" },
    badgeText: { fontSize: 12, fontWeight: "700" },
});
