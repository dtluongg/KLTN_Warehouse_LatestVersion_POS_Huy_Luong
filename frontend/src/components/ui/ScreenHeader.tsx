import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../src/hooks/useTheme";

type ScreenHeaderProps = {
    title?: string;
    subtitle?: string;
    rightSlot?: React.ReactNode;
};

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    rightSlot,
}) => {
    const { colors, metrics } = useTheme();

    if (!rightSlot) return null;

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
                paddingHorizontal: metrics.spacing.md,
                paddingVertical: metrics.spacing.sm,
            }
        ]}>
            {/* Spacer đẩy rightSlot sang phải */}
            <View style={styles.spacer} />
            <View style={styles.rightSlot}>{rightSlot}</View>
        </View>
    );
};

export default ScreenHeader;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        borderBottomWidth: 1,
    },
    spacer: {
        flex: 1,
    },
    rightSlot: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
});
