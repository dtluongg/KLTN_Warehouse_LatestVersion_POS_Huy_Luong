import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  ActivityIndicator, TouchableOpacity, useWindowDimensions, RefreshControl,
} from 'react-native';
import { theme } from '../utils/theme';
import { Feather } from '@expo/vector-icons';
import { axiosClient } from '../api/axiosClient';

// ─── Types ──────────────────────────────────────────────
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
}

// ─── Status Badge ───────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT:     { bg: '#fef3c7', text: '#92400e' },
  POSTED:    { bg: '#d1fae5', text: '#065f46' },
  COMPLETED: { bg: '#d1fae5', text: '#065f46' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
  PENDING:   { bg: '#dbeafe', text: '#1e40af' },
  ACTIVE:    { bg: '#d1fae5', text: '#065f46' },
  INACTIVE:  { bg: '#f3f4f6', text: '#6b7280' },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const colors = STATUS_COLORS[status] || { bg: '#f3f4f6', text: '#374151' };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{status}</Text>
    </View>
  );
};

// ─── Money formatter ────────────────────────────────────
export const formatMoney = (v: any) => {
  if (v == null) return '—';
  const num = typeof v === 'number' ? v : parseFloat(v);
  if (isNaN(num)) return '—';
  return num.toLocaleString('vi-VN') + 'đ';
};

// ─── Nested value accessor ──────────────────────────────
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
};

// ─── Main Component ─────────────────────────────────────
const DataTableScreen: React.FC<DataTableScreenProps> = ({
  apiUrl,
  columns,
  title,
  idField = 'id',
  searchPlaceholder = 'Tìm kiếm...',
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const fetchData = async () => {
    try {
      const res = await axiosClient.get(apiUrl);
      setData(res.data);
    } catch (e: any) {
      console.log(`Lỗi fetch ${apiUrl}:`, e?.message);
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

  // Simple text search across all columns
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const v = getNestedValue(row, col.key);
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [data, search]);

  // ─── Desktop Table ──────────────────────────────────
  const renderDesktopTable = () => (
    <View style={styles.tableContainer}>
      {/* Table Header */}
      <View style={styles.tableHeaderRow}>
        {columns.map(col => (
          <View key={col.key} style={[styles.tableHeaderCell, col.width ? { width: col.width } : { flex: col.flex || 1 }]}>
            <Text style={styles.tableHeaderText}>{col.label}</Text>
          </View>
        ))}
      </View>
      {/* Rows */}
      <FlatList
        data={filtered}
        keyExtractor={(item, index) => String(item[idField] ?? index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        renderItem={({ item, index }) => (
          <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
            {columns.map(col => (
              <View key={col.key} style={[styles.tableCell, col.width ? { width: col.width } : { flex: col.flex || 1 }]}>
                {col.render ? col.render(getNestedValue(item, col.key), item) : (
                  <Text style={styles.tableCellText} numberOfLines={1}>
                    {getNestedValue(item, col.key) != null ? String(getNestedValue(item, col.key)) : '—'}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={40} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyText}>Không có dữ liệu</Text>
          </View>
        }
      />
    </View>
  );

  // ─── Mobile Card List ───────────────────────────────
  const renderMobileCards = () => (
    <FlatList
      data={filtered}
      keyExtractor={(item, index) => String(item[idField] ?? index)}
      contentContainerStyle={{ padding: theme.spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          {columns.map(col => (
            <View key={col.key} style={styles.cardRow}>
              <Text style={styles.cardLabel}>{col.label}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                {col.render ? col.render(getNestedValue(item, col.key), item) : (
                  <Text style={styles.cardValue} numberOfLines={1}>
                    {getNestedValue(item, col.key) != null ? String(getNestedValue(item, col.key)) : '—'}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={40} color={theme.colors.mutedForeground} />
          <Text style={styles.emptyText}>Không có dữ liệu</Text>
        </View>
      }
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
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={theme.colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.colors.mutedForeground}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtered.length} bản ghi</Text>
        </View>
      </View>

      {/* Content */}
      {isDesktop ? renderDesktopTable() : renderMobileCards()}
    </View>
  );
};

export default DataTableScreen;

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: theme.colors.mutedForeground, fontSize: 14 },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: theme.spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: theme.colors.foreground },
  countBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  countText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },

  // Desktop Table
  tableContainer: { flex: 1 },
  tableHeaderRow: {
    flexDirection: 'row', backgroundColor: '#f8fafc',
    borderBottomWidth: 2, borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  tableHeaderCell: { paddingHorizontal: 8 },
  tableHeaderText: { fontSize: 12, fontWeight: '700', color: theme.colors.mutedForeground, textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  tableRowEven: { backgroundColor: '#fafbfc' },
  tableCell: { paddingHorizontal: 8 },
  tableCellText: { fontSize: 13, color: theme.colors.foreground },

  // Mobile Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: 8,
    borderWidth: 1, borderColor: theme.colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  cardLabel: { fontSize: 12, color: theme.colors.mutedForeground, fontWeight: '500' },
  cardValue: { fontSize: 13, color: theme.colors.foreground, fontWeight: '500' },

  // Empty state
  emptyContainer: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: theme.colors.mutedForeground },

  // Status badge
  badge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 999, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
