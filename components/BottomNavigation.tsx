import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type BottomNavigationProps = {
  active: "home" | "pesanan" | "profil";
};

export function BottomNavigation({ active }: BottomNavigationProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <NavItem
        label="Home"
        icon="home"
        active={active === "home"}
        onPress={() => router.push("/")}
      />
      <NavItem
        label="Pesanan"
        icon="receipt-outline"
        active={active === "pesanan"}
        onPress={() => router.push("/pesanan")}
      />
      <NavItem
        label="Profil"
        icon="person-circle-outline"
        active={active === "profil"}
        onPress={() => router.push("/profile")}
      />
    </View>
  );
}

function NavItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Ionicons
        name={icon}
        size={22}
        color={active ? AppColors.primaryDark : AppColors.mutedText}
      />
      <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: AppColors.surface,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    marginTop: 4,
    fontSize: 11,
    color: AppColors.mutedText,
    fontWeight: "400",
  },
  itemLabelActive: {
    color: AppColors.primaryDark,
    fontWeight: "700",
  },
});
