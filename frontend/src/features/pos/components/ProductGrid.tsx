import React from "react";
import {
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Image,
    useWindowDimensions
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { Typography } from "../../../components/ui/Typography";

const MOCK_CATEGORIES = [
    { id: 0, name: "Tất cả" },
    { id: 1, name: "Phân bón" },
    { id: 2, name: "Thuốc BVTV" },
    { id: 3, name: "Hạt giống" },
    { id: 4, name: "Dụng cụ" },
];

export const ProductGrid = ({
    products,
    loading,
    searchKeyword,
    setSearchKeyword,
    activeCategoryId,
    setActiveCategoryId,
    handleAddToCart
}: any) => {
    const { colors, metrics } = useTheme();
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 1024;

    const filteredProducts = products.filter((p: any) => {
        const itemCategoryId = p.category?.id || p.categoryId;
        const matchCategory = activeCategoryId === 0 || itemCategoryId === activeCategoryId;
        const kw = searchKeyword.toLowerCase();
        if (!kw) return matchCategory;

        const safeStr = (val: string | undefined | null) => (val || "").toLowerCase();
        const matchSearch =
            safeStr(p.name).includes(kw) ||
            safeStr(p.shortName).includes(kw) ||
            safeStr(p.sku).includes(kw) ||
            safeStr(p.barcode).includes(kw);

        return matchCategory && matchSearch;
    });

    return (
        <View style={!isLargeScreen ? null : { flex: 6.5, padding: metrics.spacing.lg }}>
            {/* Header & Search */}
            <View style={[styles.headerArea, !isLargeScreen && { flexDirection: "column", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingTop: 16 }]}>
                <Typography variant="heading2" color={colors.textPrimary}>Danh Sách Sản Phẩm</Typography>
                <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }, !isLargeScreen && { width: "100%" }]}>
                    <Feather name="search" size={20} color={colors.textDisabled} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.textPrimary }]}
                        placeholder="Tìm theo tên sản phẩm, mã SKU..."
                        placeholderTextColor={colors.textDisabled}
                        value={searchKeyword}
                        onChangeText={setSearchKeyword}
                    />
                    {searchKeyword.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchKeyword("")}>
                            <Feather name="x-circle" size={18} color={colors.textDisabled} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Categories */}
            <View style={{ marginBottom: metrics.spacing.lg, paddingHorizontal: isLargeScreen ? 0 : 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {MOCK_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryChip,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                                activeCategoryId === cat.id && { backgroundColor: 'rgba(0,113,227,0.1)', borderColor: colors.primary }
                            ]}
                            onPress={() => setActiveCategoryId(cat.id)}
                        >
                            <Typography variant="bodyEmphasized" color={activeCategoryId === cat.id ? colors.primary : colors.textPrimary}>
                                {cat.name}
                            </Typography>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Product Grid */}
            {loading ? (
                <View style={[styles.loadingCenter, { padding: 40 }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <View style={{ paddingHorizontal: isLargeScreen ? 0 : 16 }}>
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={isLargeScreen ? 4 : 2}
                        key={isLargeScreen ? "cols-4" : "cols-2"}
                        scrollEnabled={false} // Disable auto flatlist scroll because container scrolls
                        columnWrapperStyle={{ gap: 16, marginBottom: 16, justifyContent: 'flex-start' }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <Typography style={{ textAlign: "center", marginTop: 40 }} color={colors.textDisabled}>
                                Không tìm thấy sản phẩm nào.
                            </Typography>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.productCard,
                                    { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: metrics.borderRadius.large },
                                    item.onHand <= 0 && { opacity: 0.5 },
                                    { maxWidth: isLargeScreen ? "23.5%" : "47.5%" },
                                ]}
                                activeOpacity={0.7}
                                onPress={() => handleAddToCart(item)}
                            >
                                {item.imageUrl ? (
                                    <Image source={{ uri: item.imageUrl }} style={[styles.productImagePlaceholder, { backgroundColor: colors.background }]} />
                                ) : (
                                    <View style={[styles.productImagePlaceholder, { backgroundColor: colors.background }]}>
                                        <Feather name="box" size={32} color={colors.textDisabled} />
                                    </View>
                                )}
                                <View style={styles.productInfo}>
                                    <Typography variant="captionBold" color={colors.textPrimary} numberOfLines={2} style={{ height: 40 }}>
                                        {item.name}
                                    </Typography>
                                    <Typography variant="micro" color={colors.textSecondary} style={{ marginTop: 4 }}>
                                        {item.sku}
                                    </Typography>
                                    <View style={styles.productFooter}>
                                        <Typography variant="bodyEmphasized" color={colors.primary}>
                                            {item.salePrice.toLocaleString("vi-VN")} đ
                                        </Typography>
                                        <Typography variant="caption" color={item.onHand <= 0 ? colors.danger : colors.textPrimary} style={item.onHand <= 0 ? { fontWeight: '700' } : {}}>
                                            SL: {item.onHand}
                                        </Typography>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    headerArea: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 40, borderRadius: 999, borderWidth: 1, width: 350 },
    searchInput: { flex: 1, marginLeft: 8, height: "100%" },
    categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
    productCard: { flex: 1, borderWidth: 1, overflow: "hidden", elevation: 1 },
    productImagePlaceholder: { height: 140, justifyContent: "center", alignItems: "center", width: "100%" },
    productInfo: { padding: 12 },
    productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12 }
});
