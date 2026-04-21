import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../src/hooks/useTheme";
import { Typography } from "./Typography";

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
    const { colors, metrics } = useTheme();

    return (
        <View style={[
            styles.container, 
            { 
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
                paddingHorizontal: metrics.spacing.md,
                paddingTop: metrics.spacing.md,
                paddingBottom: metrics.spacing.sm,
            }
        ]}>
            <View style={styles.textBlock}>
                <Typography variant="heading2" color={colors.textHero}>
                    {title}
                </Typography>
                {subtitle ? (
                    <Typography variant="caption" color={colors.textSecondary}>
                        {subtitle}
                    </Typography>
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
        gap: 8,
        borderBottomWidth: 1,
    },
    textBlock: {
        flex: 1,
        gap: 4,
    },
    rightSlot: {
        alignItems: "flex-end",
        justifyContent: "center",
    },
});
