import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "../../components/haptic-tab";

function HomeTabIcon({ color }: Readonly<{ color: string }>) {
  return <Ionicons name="home" size={24} color={color} />;
}

function PesananTabIcon({ color }: Readonly<{ color: string }>) {
  return <Ionicons name="receipt-outline" size={24} color={color} />;
}

function ProfileTabIcon({ color }: Readonly<{ color: string }>) {
  return <Ionicons name="person-circle-outline" size={24} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: "#1E40AF",
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "transparent",
          height: 72,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -4 },
          elevation: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: HomeTabIcon,
          tabBarButton: (props) => <HapticTab {...props} />,
        }}
      />

      <Tabs.Screen
        name="pesanan"
        options={{
          title: "Pesanan",
          tabBarIcon: PesananTabIcon,
          tabBarButton: (props) => <HapticTab {...props} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ProfileTabIcon,
          tabBarButton: (props) => <HapticTab {...props} />,
        }}
      />
    </Tabs>
  );
}