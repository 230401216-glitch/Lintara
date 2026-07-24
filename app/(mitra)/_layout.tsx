import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type TabItem = Readonly<{
  name:
    | "dashboard"
    | "armada"
    | "supir"
    | "booking"
    | "scan"
    | "profile";
  title: string;
  icon: IconName;
}>;

const TABS: readonly TabItem[] = [
  {
    name: "dashboard",
    title: "Beranda",
    icon: "grid-outline",
  },
  {
    name: "armada",
    title: "Jadwal Armada",
    icon: "bus-outline",
  },
  {
    name: "supir",
    title: "Supir",
    icon: "people-outline",
  },
  {
    name: "booking",
    title: "Booking",
    icon: "calendar-outline",
  },
  {
    name: "scan",
    title: "Scan",
    icon: "qr-code-outline",
  },
  {
    name: "profile",
    title: "Profil",
    icon: "person-outline",
  },
];

export default function MitraLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        header: () => null,

        sceneStyle: {
          backgroundColor: "#F8FAFC",
        },

        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#94A3B8",

        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: "#FFFFFF",

          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",

          elevation: 8,

          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 2,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            headerShown: false,

            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name={tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}

      <Tabs.Screen
        name="harga"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="jadwal"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="document-upload"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}