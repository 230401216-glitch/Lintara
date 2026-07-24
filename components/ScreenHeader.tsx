import { AppColors, AppSpacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type ScreenHeaderProps = {
  title: string;
  subtitle: string;
};

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 170,
    backgroundColor: AppColors.primaryDark,
    padding: AppSpacing.pagePadding,
    paddingTop: AppSpacing.pagePadding + 8,
    borderBottomLeftRadius: AppSpacing.headerRadius,
    borderBottomRightRadius: AppSpacing.headerRadius,
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: AppColors.onPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.onPrimarySecondary,
    maxWidth: "82%",
  },
});
