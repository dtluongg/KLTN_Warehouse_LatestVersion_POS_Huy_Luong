import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../utils/theme";

type ScreenHeaderProps = {
    title: string;
    subtitle?: string;
    rightSlot?: React.ReactNode;
};

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    subtitle,
    rightSlot,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.textBlock}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? (
                    <Text style={styles.subtitle}>{subtitle}</Text>
                ) : null}
            </View>
            {rightSlot ? (
                <View style={styles.rightSlot}>{rightSlot}</View>
            ) : null}
        </View>
    );
};

export default ScreenHeader;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    textBlock: {
        flex: 1,
        gap: 2,
    },
    title: {
        ...theme.typography.title,
        color: theme.colors.foreground,
    },
    subtitle: {
        ...theme.typography.caption,
        color: theme.colors.mutedForeground,
    },
    rightSlot: {
        alignItems: "flex-end",
        justifyContent: "center",
    },
});
