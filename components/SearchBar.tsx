import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type SearchBarProps = {
  label: string;
  onPress: () => void;
};

export function SearchBar({ label, onPress }: SearchBarProps) {
  return (
    <TouchableOpacity style={styles.searchCard} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.searchInner}>
        <Ionicons name="search" size={20} color={AppColors.mutedText} />
        <Text style={styles.searchText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  searchCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchText: {
    marginLeft: 12,
    color: AppColors.mutedText,
    fontSize: 14,
  },
});
