import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClose?: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  onClose,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons
        name="search"
        size={19}
        color="#777"
      />

      <TextInput
        style={styles.input}
        placeholder="Search jobs..."
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText("")}
        >
          <Ionicons
            name="close-circle"
            size={19}
            color="#999"
          />
        </TouchableOpacity>
      )}

      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
        >
          <Ionicons
            name="close"
            size={22}
            color="#333"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f7",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginLeft: 10,
  },

  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#222",
    paddingVertical: 0,
  },

  closeButton: {
    marginLeft: 8,
  },
});