import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/context/AuthContext";
import {
    createMitraRoute,
    createMitraSchedule,
    createMitraTravel,
    formatCurrency,
    formatDate,
    formatRoute,
    loadMitraDashboardData,
    MitraRoute,
    MitraSchedule,
    MitraTravel,
    updateMitraRoute,
    updateMitraSchedule,
    updateMitraTravel,
    uploadMitraTravelPhoto,
} from "@/lib/services/mitraData";
import DashboardCard from "../../components/mitra/DashboardCard";

type ActiveForm = "travel" | "route" | "schedule" | "routeAndSchedule";

const emptyTravelForm = { nama_travel: "", nomor_kendaraan: "", jumlah_kursi: "", deskripsi: "", foto: "" };
const emptyRouteForm = { travel_id: "", asal: "", tujuan: "", harga: "", durasi: "" };
const emptyScheduleForm = { route_id: "", tanggal: "", jam_berangkat: "", total_kursi: "" };

export default function JadwalHargaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [routes, setRoutes] = useState<MitraRoute[]>([]);
  const [schedules, setSchedules] = useState<MitraSchedule[]>([]);
  const [travels, setTravels] = useState<MitraTravel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeForm, setActiveForm] = useState<ActiveForm>("route");
  const [showForm, setShowForm] = useState(false);
  const [editingTravelId, setEditingTravelId] = useState<string | null>(null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [travelForm, setTravelForm] = useState(emptyTravelForm);
  const [selectedTravelImage, setSelectedTravelImage] = useState<string | null>(null);
  const [routeForm, setRouteForm] = useState(emptyRouteForm);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);

  const routeOptions = useMemo(
    () =>
      routes.map((route) => ({
        ...route,
        label: `${formatRoute(route.origin, route.destination)} - ${formatCurrency(route.price)}`,
      })),
    [routes]
  );

  const resetTravelForm = useCallback(() => {
    setTravelForm(emptyTravelForm);
    setSelectedTravelImage(null);
    setEditingTravelId(null);
  }, []);

  const resetRouteForm = useCallback(() => {
    setRouteForm(emptyRouteForm);
    setEditingRouteId(null);
  }, []);

  const resetScheduleForm = useCallback(() => {
    setScheduleForm(emptyScheduleForm);
    setEditingScheduleId(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await loadMitraDashboardData(user?.token, user?.role, user?.id);
      setRoutes(data.routes);
      setSchedules(data.schedules);
      setTravels(data.travels);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Gagal memuat jadwal dan harga");
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, user?.token]);

  const openTravelForm = (travel?: MitraTravel) => {
    setActiveForm("travel");
    setShowForm(true);
    resetRouteForm();
    resetScheduleForm();

    if (!travel) {
      resetTravelForm();
      return;
    }

    setEditingTravelId(travel.id);
    setTravelForm({
      nama_travel: travel.name,
      nomor_kendaraan: travel.nomorKendaraan || "",
      jumlah_kursi: String(travel.jumlahKursi || ""),
      deskripsi: travel.deskripsi || "",
      foto: travel.foto || "",
    });
    setSelectedTravelImage(travel.foto || null);
  };

  const openRouteForm = (route?: MitraRoute) => {
    setActiveForm("route");
    setShowForm(true);
    resetScheduleForm();

    if (!route) {
      resetRouteForm();
      return;
    }

    setEditingRouteId(route.id);
    setRouteForm({
      travel_id: route.travelId || "",
      asal: route.origin,
      tujuan: route.destination,
      harga: String(route.price),
      durasi: route.durasi || "",
    });
  };

  const openScheduleForm = (schedule?: MitraSchedule) => {
    setActiveForm("schedule");
    setShowForm(true);
    resetRouteForm();

    if (!schedule) {
      resetScheduleForm();
      return;
    }

    setEditingScheduleId(schedule.id);
    setScheduleForm({
      route_id: schedule.routeId || "",
      tanggal: String(schedule.date).split("T")[0],
      jam_berangkat: schedule.departureTime,
      total_kursi: String(schedule.totalSeats),
    });
  };

  const openRouteAndScheduleForm = () => {
    setActiveForm("routeAndSchedule");
    setShowForm(true);
    resetTravelForm();
    resetRouteForm();
    resetScheduleForm();
    setEditingTravelId(null);
    setEditingRouteId(null);
    setEditingScheduleId(null);
  };

  const closeForm = () => {
    setShowForm(false);
    resetRouteForm();
    resetScheduleForm();
  };

  const saveTravel = async () => {
    if (!travelForm.nama_travel.trim() || !travelForm.nomor_kendaraan.trim() || !travelForm.jumlah_kursi.trim()) {
      Alert.alert("Lengkapi Data", "Nama travel, nomor kendaraan, dan jumlah kursi harus diisi.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        nama_travel: travelForm.nama_travel.trim(),
        nomor_kendaraan: travelForm.nomor_kendaraan.trim(),
        jumlah_kursi: Number(travelForm.jumlah_kursi),
        deskripsi: travelForm.deskripsi.trim(),
      };

      let travelId = editingTravelId;
      if (editingTravelId) {
        await updateMitraTravel(editingTravelId, payload, user?.token);
      } else {
        const created = await createMitraTravel(payload, user?.token);
        travelId = String(created.id);
      }

      const isLocalImage = selectedTravelImage && /^(file|content|data):/.test(selectedTravelImage);
      if (travelId && selectedTravelImage && isLocalImage) {
        await uploadMitraTravelPhoto(travelId, selectedTravelImage, user?.token);
      }

      await refresh();
      closeForm();
      Alert.alert("Berhasil", editingTravelId ? "Armada berhasil diperbarui." : "Armada berhasil ditambahkan.");
    } catch (nextError) {
      Alert.alert("Gagal", nextError instanceof Error ? nextError.message : "Gagal menyimpan armada.");
    } finally {
      setLoading(false);
    }
  };

  const saveRoute = async () => {
    if (!routeForm.travel_id || !routeForm.asal.trim() || !routeForm.tujuan.trim() || !routeForm.harga.trim()) {
      Alert.alert("Lengkapi Data", "Armada, asal, tujuan, dan harga harus diisi.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        travel_id: routeForm.travel_id,
        asal: routeForm.asal.trim(),
        tujuan: routeForm.tujuan.trim(),
        harga: Number(routeForm.harga),
        durasi: routeForm.durasi.trim(),
      };

      if (editingRouteId) {
        await updateMitraRoute(editingRouteId, payload, user?.token);
      } else {
        await createMitraRoute(payload, user?.token);
      }

      await refresh();
      closeForm();
      Alert.alert("Berhasil", editingRouteId ? "Harga rute diperbarui." : "Harga rute ditambahkan.");
    } catch (nextError) {
      Alert.alert("Gagal", nextError instanceof Error ? nextError.message : "Gagal menyimpan harga.");
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    if (!scheduleForm.route_id || !scheduleForm.tanggal || !scheduleForm.jam_berangkat || !scheduleForm.total_kursi) {
      Alert.alert("Lengkapi Data", "Rute, tanggal, jam, dan kursi harus diisi.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        route_id: scheduleForm.route_id,
        tanggal: scheduleForm.tanggal,
        jam_berangkat: scheduleForm.jam_berangkat,
        total_kursi: Number(scheduleForm.total_kursi),
      };

      if (editingScheduleId) {
        await updateMitraSchedule(editingScheduleId, payload, user?.token);
      } else {
        await createMitraSchedule(payload, user?.token);
      }

      await refresh();
      closeForm();
      Alert.alert("Berhasil", editingScheduleId ? "Jadwal diperbarui." : "Jadwal ditambahkan.");
    } catch (nextError) {
      Alert.alert("Gagal", nextError instanceof Error ? nextError.message : "Gagal menyimpan jadwal.");
    } finally {
      setLoading(false);
    }
  };

  const handlePickTravelImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Izin ditolak", "Aplikasi membutuhkan akses galeri untuk mengunggah foto armada.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedTravelImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Gagal", "Tidak dapat memilih foto armada. Coba lagi nanti.");
    }
  };

  const saveRouteAndSchedule = async () => {
    if (!routeForm.travel_id || !routeForm.asal.trim() || !routeForm.tujuan.trim() || !routeForm.harga.trim()) {
      Alert.alert("Lengkapi Data", "Armada, asal, tujuan, dan harga harus diisi.");
      return;
    }

    if (!scheduleForm.tanggal || !scheduleForm.jam_berangkat || !scheduleForm.total_kursi) {
      Alert.alert("Lengkapi Data", "Tanggal, jam berangkat, dan jumlah kursi harus diisi.");
      return;
    }

    try {
      setLoading(true);
      const routeResult = await createMitraRoute(
        {
          travel_id: routeForm.travel_id,
          asal: routeForm.asal.trim(),
          tujuan: routeForm.tujuan.trim(),
          harga: Number(routeForm.harga),
          durasi: routeForm.durasi.trim(),
        },
        user?.token
      );

      await createMitraSchedule(
        {
          route_id: String(routeResult.id),
          tanggal: scheduleForm.tanggal,
          jam_berangkat: scheduleForm.jam_berangkat,
          total_kursi: Number(scheduleForm.total_kursi),
        },
        user?.token
      );

      await refresh();
      closeForm();
      Alert.alert("Berhasil", "Jadwal dan harga perjalanan berhasil ditambahkan.");
    } catch (nextError) {
      Alert.alert("Gagal", nextError instanceof Error ? nextError.message : "Gagal menyimpan jadwal dan harga.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Jadwal & Harga</Text>
            <Text style={styles.subtitle}>Kelola rute, tarif, dan jadwal dalam satu tempat</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{travels.length}</Text>
            <Text style={styles.summaryLabel}>Armada</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{routes.length}</Text>
            <Text style={styles.summaryLabel}>Rute Harga</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{schedules.length}</Text>
            <Text style={styles.summaryLabel}>Jadwal Aktif</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => openTravelForm()} disabled={loading}>
            <Ionicons name="bus-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Tambah Armada</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => openRouteForm()} disabled={loading}>
            <Ionicons name="pricetag-outline" size={18} color="#1E3A8A" />
            <Text style={styles.secondaryButtonText}>Edit Harga</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => openScheduleForm()} disabled={loading}>
            <Ionicons name="calendar-outline" size={18} color="#1E3A8A" />
            <Text style={styles.secondaryButtonText}>Tambah Jadwal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tertiaryButton} onPress={openRouteAndScheduleForm} disabled={loading}>
            <Ionicons name="layers-outline" size={18} color="#1E3A8A" />
            <Text style={styles.tertiaryButtonText}>Tambah Rute + Jadwal</Text>
          </TouchableOpacity>
        </View>

        {showForm ? (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
              {activeForm === "travel"
                ? editingTravelId
                  ? "Edit Armada"
                  : "Tambah Armada"
                : activeForm === "route"
                  ? editingRouteId
                    ? "Edit Harga Rute"
                    : "Tambah Harga Rute"
                  : activeForm === "schedule"
                    ? editingScheduleId
                      ? "Edit Jadwal"
                      : "Tambah Jadwal"
                    : "Tambah Rute + Jadwal"}
            </Text>
            <TouchableOpacity onPress={closeForm} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

              {activeForm === "travel" ? (
              <>
                <Text style={styles.formLabel}>Nama Armada</Text>
                <TextInput style={styles.input} placeholder="Nama travel" value={travelForm.nama_travel} onChangeText={(value) => setTravelForm((current) => ({ ...current, nama_travel: value }))} />
                <TextInput style={styles.input} placeholder="Nomor kendaraan" value={travelForm.nomor_kendaraan} onChangeText={(value) => setTravelForm((current) => ({ ...current, nomor_kendaraan: value }))} />
                <TextInput style={styles.input} placeholder="Jumlah kursi" value={travelForm.jumlah_kursi} onChangeText={(value) => setTravelForm((current) => ({ ...current, jumlah_kursi: value.replace(/\D/g, "") }))} keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Deskripsi" value={travelForm.deskripsi} onChangeText={(value) => setTravelForm((current) => ({ ...current, deskripsi: value }))} />
                <Text style={styles.formLabel}>Foto Armada</Text>
                <TouchableOpacity style={styles.photoPicker} onPress={handlePickTravelImage} disabled={loading}>
                  {selectedTravelImage ? (
                    <Image source={{ uri: selectedTravelImage }} style={styles.photoPreview} />
                  ) : travelForm.foto ? (
                    <Image source={{ uri: travelForm.foto }} style={styles.photoPreview} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="image-outline" size={28} color="#1E40AF" />
                      <Text style={styles.photoPlaceholderText}>Pilih foto armada</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={saveTravel} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{editingTravelId ? "Perbarui Armada" : "Simpan Armada"}</Text>}
                </TouchableOpacity>
              </>
              ) : activeForm === "route" ? (
              <>
                <Text style={styles.formLabel}>Pilih Armada</Text>
                <View style={styles.choiceRow}>
                  {travels.map((travel) => (
                    <TouchableOpacity
                      key={travel.id}
                      style={[styles.choiceChip, routeForm.travel_id === travel.id && styles.choiceChipActive]}
                      onPress={() => setRouteForm((current) => ({ ...current, travel_id: travel.id }))}
                    >
                      <Text style={[styles.choiceText, routeForm.travel_id === travel.id && styles.choiceTextActive]}>{travel.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput style={styles.input} placeholder="Asal" value={routeForm.asal} onChangeText={(value) => setRouteForm((current) => ({ ...current, asal: value }))} />
                <TextInput style={styles.input} placeholder="Tujuan" value={routeForm.tujuan} onChangeText={(value) => setRouteForm((current) => ({ ...current, tujuan: value }))} />
                <TextInput style={styles.input} placeholder="Harga" value={routeForm.harga} onChangeText={(value) => setRouteForm((current) => ({ ...current, harga: value.replace(/\D/g, "") }))} keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Durasi, contoh 5 jam" value={routeForm.durasi} onChangeText={(value) => setRouteForm((current) => ({ ...current, durasi: value }))} />
                <TouchableOpacity style={styles.saveButton} onPress={saveRoute} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{editingRouteId ? "Perbarui Harga" : "Simpan Harga"}</Text>}
                </TouchableOpacity>
              </>
            ) : activeForm === "schedule" ? (
              <>
                <Text style={styles.formLabel}>Pilih Rute</Text>
                <View style={styles.choiceRow}>
                  {routeOptions.map((route) => (
                    <TouchableOpacity
                      key={route.id}
                      style={[styles.choiceChip, scheduleForm.route_id === route.id && styles.choiceChipActive]}
                      onPress={() => setScheduleForm((current) => ({ ...current, route_id: route.id }))}
                    >
                      <Text style={[styles.choiceText, scheduleForm.route_id === route.id && styles.choiceTextActive]}>{route.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput style={styles.input} placeholder="Tanggal, contoh 2026-07-01" value={scheduleForm.tanggal} onChangeText={(value) => setScheduleForm((current) => ({ ...current, tanggal: value }))} />
                <TextInput style={styles.input} placeholder="Jam berangkat, contoh 08:30" value={scheduleForm.jam_berangkat} onChangeText={(value) => setScheduleForm((current) => ({ ...current, jam_berangkat: value }))} />
                <TextInput style={styles.input} placeholder="Total kursi" value={scheduleForm.total_kursi} onChangeText={(value) => setScheduleForm((current) => ({ ...current, total_kursi: value.replace(/\D/g, "") }))} keyboardType="numeric" />
                <TouchableOpacity style={styles.saveButton} onPress={saveSchedule} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{editingScheduleId ? "Perbarui Jadwal" : "Simpan Jadwal"}</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.formLabel}>Pilih Armada</Text>
                <View style={styles.choiceRow}>
                  {travels.map((travel) => (
                    <TouchableOpacity
                      key={travel.id}
                      style={[styles.choiceChip, routeForm.travel_id === travel.id && styles.choiceChipActive]}
                      onPress={() => setRouteForm((current) => ({ ...current, travel_id: travel.id }))}
                    >
                      <Text style={[styles.choiceText, routeForm.travel_id === travel.id && styles.choiceTextActive]}>{travel.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput style={styles.input} placeholder="Asal" value={routeForm.asal} onChangeText={(value) => setRouteForm((current) => ({ ...current, asal: value }))} />
                <TextInput style={styles.input} placeholder="Tujuan" value={routeForm.tujuan} onChangeText={(value) => setRouteForm((current) => ({ ...current, tujuan: value }))} />
                <TextInput style={styles.input} placeholder="Harga" value={routeForm.harga} onChangeText={(value) => setRouteForm((current) => ({ ...current, harga: value.replace(/\D/g, "") }))} keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Durasi, contoh 5 jam" value={routeForm.durasi} onChangeText={(value) => setRouteForm((current) => ({ ...current, durasi: value }))} />
                <View style={styles.divider} />
                <TextInput style={styles.input} placeholder="Tanggal, contoh 2026-07-01" value={scheduleForm.tanggal} onChangeText={(value) => setScheduleForm((current) => ({ ...current, tanggal: value }))} />
                <TextInput style={styles.input} placeholder="Jam berangkat, contoh 08:30" value={scheduleForm.jam_berangkat} onChangeText={(value) => setScheduleForm((current) => ({ ...current, jam_berangkat: value }))} />
                <TextInput style={styles.input} placeholder="Total kursi" value={scheduleForm.total_kursi} onChangeText={(value) => setScheduleForm((current) => ({ ...current, total_kursi: value.replace(/\D/g, "") }))} keyboardType="numeric" />
                <TouchableOpacity style={styles.saveButton} onPress={saveRouteAndSchedule} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Simpan Rute + Jadwal</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : null}

        <DashboardCard title="Daftar Armada" subtitle="Kelola armada mitra">
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {travels.map((item) => (
            <View key={item.id} style={styles.rowCard}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowMeta}>No. {item.nomorKendaraan || "-"} • {item.jumlahKursi || 0} kursi</Text>
                <Text style={styles.rowMeta}>Status: {item.status}</Text>
              </View>
              <TouchableOpacity style={styles.inlineButton} onPress={() => openTravelForm(item)}>
                <Text style={styles.inlineButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          ))}
          {!loading && !error && travels.length === 0 ? <Text style={styles.emptyText}>Belum ada armada di database.</Text> : null}
        </DashboardCard>

        <DashboardCard title="Harga Rute" subtitle="Tarif perjalanan aktif">
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {routes.map((item) => (
            <View key={item.id} style={styles.rowCard}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{formatRoute(item.origin, item.destination)}</Text>
                <Text style={styles.rowMeta}>{formatCurrency(item.price)} - Durasi: {item.durasi || "-"}</Text>
                <Text style={styles.rowMeta}>Status: {item.status}</Text>
              </View>
              <TouchableOpacity style={styles.inlineButton} onPress={() => openRouteForm(item)}>
                <Text style={styles.inlineButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          ))}
          {!loading && !error && routes.length === 0 ? <Text style={styles.emptyText}>Belum ada harga rute di database.</Text> : null}
        </DashboardCard>

        <DashboardCard title="Jadwal Berangkat" subtitle="Tanggal dan jam perjalanan">
          {schedules.map((item) => (
            <View key={item.id} style={styles.rowCard}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{formatRoute(item.origin, item.destination)}</Text>
                <Text style={styles.rowMeta}>{formatDate(item.date)} - {item.departureTime} - {item.totalSeats} kursi</Text>
                <Text style={styles.rowMeta}>Status: {item.status}</Text>
              </View>
              <TouchableOpacity style={styles.inlineButton} onPress={() => openScheduleForm(item)}>
                <Text style={styles.inlineButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          ))}
          {!loading && !error && schedules.length === 0 ? <Text style={styles.emptyText}>Belum ada jadwal di database.</Text> : null}
        </DashboardCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 36 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  headerCopy: { flex: 1 },
  backButton: { marginRight: 12, width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  subtitle: { color: "#64748B", marginTop: 2 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  summaryBox: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#E2E8F0" },
  summaryValue: { color: "#1E3A8A", fontSize: 24, fontWeight: "800" },
  summaryLabel: { color: "#64748B", fontSize: 12, marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  primaryButton: { flex: 1, backgroundColor: "#1E3A8A", padding: 14, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  secondaryButton: { flex: 1, backgroundColor: "#FFFFFF", padding: 14, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, borderWidth: 1, borderColor: "#BFDBFE" },
  tertiaryButton: { backgroundColor: "#FFFFFF", padding: 14, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, borderWidth: 1, borderColor: "#CBD5E1", marginBottom: 14 },
  tertiaryButtonText: { color: "#1E3A8A", fontWeight: "700" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700" },
  secondaryButtonText: { color: "#1E3A8A", fontWeight: "700" },
  photoPicker: {
    width: "100%",
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: 140,
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  photoPlaceholderText: {
    color: "#1E3A8A",
    fontWeight: "700",
    marginTop: 8,
  },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 14 },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  formTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  closeButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  formLabel: { fontSize: 13, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 12 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  choiceChip: { backgroundColor: "#F1F5F9", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  choiceChipActive: { backgroundColor: "#1E3A8A" },
  choiceText: { color: "#334155", fontSize: 12, fontWeight: "600" },
  choiceTextActive: { color: "#FFFFFF" },
  input: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 12, padding: 12, marginBottom: 10, backgroundColor: "#FFFFFF" },
  saveButton: { backgroundColor: "#1E3A8A", padding: 14, borderRadius: 12, alignItems: "center" },
  rowCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  rowMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  inlineButton: { backgroundColor: "#DBEAFE", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  inlineButtonText: { color: "#1E3A8A", fontWeight: "700", fontSize: 12 },
  emptyText: { color: "#64748B", fontSize: 13, paddingVertical: 8 },
  errorText: { color: "#DC2626", fontSize: 13, paddingVertical: 8 },
});
