import React from "react";
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    TextInputProps,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { theme } from "../../utils/theme";

type SearchBarProps = {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    inputProps?: Omit<TextInputProps, "value" | "onChangeText" | "placeholder">;
};

const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChangeText,
    placeholder = "Tìm kiếm...",
    inputProps,
}) => {
    return (
        <View style={styles.container}>
            <Feather
                name="search"
                size={16}
                color={theme.colors.mutedForeground}
            />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.mutedForeground}
                style={styles.input}
                {...inputProps}
            />
            {value.length > 0 ? (
                <TouchableOpacity
                    onPress={() => onChangeText("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Feather
                        name="x"
                        size={16}
                        color={theme.colors.mutedForeground}
                    />
                </TouchableOpacity>
            ) : null}
        </View>
    );
};

export default SearchBar;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surfaceRaised,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    input: {
        flex: 1,
        color: theme.colors.foreground,
        fontSize: 14,
        paddingVertical: 0,
    },
});
