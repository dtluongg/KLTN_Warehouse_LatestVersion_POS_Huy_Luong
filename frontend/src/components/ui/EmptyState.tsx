import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../utils/theme";

type EmptyStateProps = {
    title?: string;
    description?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({
    title = "Không có dữ liệu",
    description,
}) => {
    return (
        <View style={styles.container}>
            <Feather
                name="inbox"
                size={36}
                color={theme.colors.mutedForeground}
            />
            <Text style={styles.title}>{title}</Text>
            {description ? (
                <Text style={styles.description}>{description}</Text>
            ) : null}
        </View>
    );
};

export default EmptyState;

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 48,
        paddingHorizontal: 20,
        gap: 8,
    },
    title: {
        ...theme.typography.body,
        color: theme.colors.foreground,
        fontWeight: "600",
    },
    description: {
        ...theme.typography.caption,
        color: theme.colors.mutedForeground,
        textAlign: "center",
    },
});
