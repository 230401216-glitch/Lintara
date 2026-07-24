import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SearchBar } from "@/components/SearchBar";
import { fetchTravelCatalog, travelData } from "@/data/travel";

type TravelCardProps = {
  companyName: string;
  subtitle: string;
  initials: string;
  onPress: () => void;
};

function TravelPartnerCard({ companyName, subtitle, initials, onPress }: TravelCardProps) {
  return (
    <TouchableOpacity style={styles.partnerCard} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.partnerLogo}>
        <Text style={styles.partnerLogoText}>{initials}</Text>
      </View>
      <View style={styles.partnerInfo}>
        <Text style={styles.partnerTitle}>{companyName}</Text>
        <Text style={styles.partnerSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
    </TouchableOpacity>
  );
}

export default function Home() {
  const router = useRouter();
  const [catalog, setCatalog] = useState(travelData);

  useEffect(() => {
    const loadCatalog = async () => {
      const nextCatalog = await fetchTravelCatalog();
      setCatalog(nextCatalog);
    };

    void loadCatalog();
  }, []);

  const partnerItems = useMemo(() => {
    const partnerMap = new Map<string, {
      id: string;
      name: string;
      subtitle: string;
      initials: string;
      route: typeof catalog[number]["routes"][number] | null;
      vehicleType: string;
    }>();

    catalog.forEach((travel) => {
      const partnerKey =
        travel.companyName?.trim().toLowerCase() || travel.name?.trim().toLowerCase() || travel.id;

      if (!partnerMap.has(partnerKey)) {
        const firstRoute = travel.routes[0] ?? null;
        partnerMap.set(partnerKey, {
          id: String(travel.mitraProfileId ?? travel.id), // Use mitraProfileId for backend filter
          name: travel.companyName,
          subtitle: firstRoute
            ? `${firstRoute.from} → ${firstRoute.to}`
            : travel.busTypes.join(" • "),
          initials: travel.companyName.slice(0, 2).toUpperCase(),
          route: firstRoute,
          vehicleType: travel.busTypes[0] ?? "Bus",
        });
      }
    });

    return Array.from(partnerMap.values());
  }, [catalog]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Lintara"
          subtitle="Cari dan pesan travel antarkota dengan cepat."
        />

        <View style={styles.searchWrapper}>
          <SearchBar
            label="Cari travel atau tujuan"
            onPress={() => router.push("/search-form")}
          />
        </View>

        <Card style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Pesan perjalanan</Text>
              <Text style={styles.sectionSubtitle}>Pilih rute yang Anda inginkan</Text>
            </View>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          </View>

          <Text style={styles.label}>Pilih PT / Mitra Travel</Text>

          {partnerItems.map((item) => (
            <TravelPartnerCard
              key={item.id}
              companyName={item.name}
              subtitle={item.subtitle}
              initials={item.initials}
              onPress={() =>
                router.push({
                  pathname: "/search",
                  params: {
                    ptId: item.id,
                  },
                })
              }
            />
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingBottom: 32,
  },
  searchWrapper: {
    marginHorizontal: 20,
    marginTop: -28,
    marginBottom: 20,
  },
  formCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
  },
  liveBadge: {
    backgroundColor: "#DCFCE7",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  liveBadgeText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "700",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },
  partnerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  partnerLogo: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  partnerLogoText: {
    color: "#1E40AF",
    fontWeight: "800",
    fontSize: 16,
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  partnerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  partnerSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
  },
});
