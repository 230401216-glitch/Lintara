import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatCardProps {
  label: string;
  value: string;
  iconName: string;
  color: string;
  subtitle?: string;
}

export default function StatCard({
  label,
  value,
  iconName,
  color,
  subtitle,
}: StatCardProps) {
  return (
    <View style={[styles.card, { borderColor: `${color}22` }]}> 
      <View style={[styles.iconWrap, { backgroundColor: `${color}16` }]}> 
        <Ionicons name={iconName as never} size={20} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: "center",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
});
