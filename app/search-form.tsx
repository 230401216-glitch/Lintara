import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { BottomNavigation } from "@/components/BottomNavigation";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function SearchFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract params dari route (dari Home saat user pilih PT)
  const ptId = typeof params.ptId === "string" ? params.ptId : "";
  const initialFrom = typeof params.from === "string" ? params.from : "";
  const initialTo = typeof params.to === "string" ? params.to : "";
  const initialVehicleType = typeof params.vehicleType === "string" ? params.vehicleType : "";

  // Form state
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [vehicleType, setVehicleType] = useState(initialVehicleType);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const formatDate = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSearch = () => {
    // Validasi form
    if (!from.trim()) {
      alert("Masukkan kota asal");
      return;
    }
    if (!to.trim()) {
      alert("Masukkan kota tujuan");
      return;
    }
    if (!date) {
      alert("Pilih tanggal keberangkatan");
      return;
    }

    // Navigate ke halaman hasil pencarian dengan SEMUA parameter
    router.push({
      pathname: "/search",
      params: {
        from: from.trim(),
        to: to.trim(),
        vehicleType: vehicleType.trim(),
        date: formatDate(date),
        ptId: ptId,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Lintara"
          subtitle="Cari dan pesan travel antarkota dengan cepat."
        />

        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Isi Detail Pencarian</Text>

          {/* Kota Asal */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Kota Asal</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan kota asal"
              value={from}
              onChangeText={setFrom}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Kota Tujuan */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Kota Tujuan</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan kota tujuan"
              value={to}
              onChangeText={setTo}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Jenis Kendaraan */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Jenis Kendaraan</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Executive, AC, Non AC"
              value={vehicleType}
              onChangeText={setVehicleType}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Tanggal Keberangkatan */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tanggal Keberangkatan</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={18} color="#1E40AF" />
              <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
            />
          )}

          {/* Tombol Cari Travel */}
          <TouchableOpacity
            style={styles.searchButton}
            activeOpacity={0.8}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>Cari Travel</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </Card>
      </ScrollView>

      <BottomNavigation active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
  },
  dateButton: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 14,
    color: "#0F172A",
    marginLeft: 10,
    fontWeight: "600",
  },
  searchButton: {
    backgroundColor: "#1E40AF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#1E40AF",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginRight: 10,
  },
});
