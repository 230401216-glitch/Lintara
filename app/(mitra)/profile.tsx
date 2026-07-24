import { API_BASE_URL } from "@/constants/api";
import { COMPANY_NAME } from "@/constants/company";
import { useAuth } from "@/lib/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // NOSONAR: S1874 - SafeAreaView from safe-area-context is not deprecated

export default function MitraProfileScreen() {
  const router = useRouter();
  const { logout, user, updatePhoto } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState("Belum diunggah");
  const [uploadingDocument, setUploadingDocument] = useState(false);

  useEffect(() => {
    setAvatar(user?.photo ?? null);
  }, [user?.photo]);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  async function uploadMitraPhoto(uri: string) {
    if (!user?.token) {
      Alert.alert("Gagal", "Anda harus login untuk mengunggah foto.");
      return;
    }

    try {
      setUploading(true);
      const filename = uri.split("/").pop() ?? "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image";
      const formData = new FormData();
      formData.append("photo", {
        uri,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/auth/mitra/photo`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Gagal mengunggah foto.");
      }

      if (data.photo) {
        updatePhoto(data.photo);
        setAvatar(data.photo);
      }

      Alert.alert("Sukses", "Foto profil mitra berhasil diunggah.");
    } catch (error) {
      Alert.alert("Gagal", error instanceof Error ? error.message : "Gagal mengunggah foto. Coba lagi nanti.");
    } finally {
      setUploading(false);
    }
  }

  async function uploadMitraDocument(uri: string) {
    if (!user?.token) {
      Alert.alert("Gagal", "Anda harus login untuk mengunggah dokumen.");
      return;
    }

    try {
      setUploadingDocument(true);
      const filename = uri.split("/").pop() ?? "document.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "application/octet-stream";
      const formData = new FormData();
      formData.append("document", {
        uri,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/auth/mitra/document`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Gagal mengunggah dokumen.");
      }

      setDocumentUrl(data.data?.official_document_url ?? null);
      setDocumentStatus(data.data?.document_status ?? "Diajukan");
      Alert.alert("Sukses", "Dokumen resmi berhasil diunggah. Tunggu persetujuan admin.");
    } catch (error) {
      Alert.alert("Gagal", error instanceof Error ? error.message : "Gagal mengunggah dokumen. Coba lagi nanti.");
    } finally {
      setUploadingDocument(false);
    }
  }

  async function handlePickAvatar() {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Izin ditolak", "Aplikasi membutuhkan akses galeri untuk mengunggah foto.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setAvatar(uri);
        await uploadMitraPhoto(uri);
      }
    } catch {
      Alert.alert("Gagal", "Tidak dapat memilih foto. Coba lagi nanti.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Profil Mitra</Text>
            <Text style={styles.subtitle}>Informasi perusahaan dan akun</Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? "M"}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handlePickAvatar} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user?.name || COMPANY_NAME}</Text>
          <Text style={styles.role}>Mitra - Operasional</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Detail Kontak</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telepon</Text>
            <Text style={styles.infoValue}>{user?.phone || "-"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{user?.role || "MITRA"}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Dokumen Resmi</Text>
              <Text style={styles.sectionSubtitle}>Status dan riwayat dokumen travel Mitra.</Text>
            </View>
            <Text style={styles.statusChip}>SUBMITTED</Text>
          </View>
          <Image
            source={{ uri: "https://via.placeholder.com/300x180.png?text=Dokumen" }}
            style={styles.documentImage}
          />
          <Text style={styles.cardMeta}>Dokumen travel sudah diajukan dan menunggu verifikasi.</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => Alert.alert("Unduh", "Fitur unduh belum tersedia.")}
          >
            <Text style={styles.primaryButtonText}>Unduh Dokumen</Text>
          </TouchableOpacity>
          {user?.role === "MITRA" ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={async () => {
                try {
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== "granted") {
                    Alert.alert("Izin ditolak", "Aplikasi membutuhkan akses galeri untuk mengunggah dokumen.");
                    return;
                  }

                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    quality: 0.7,
                  });

                  if (!result.canceled && result.assets.length > 0) {
                    await uploadMitraDocument(result.assets[0].uri);
                  }
                } catch {
                  Alert.alert("Gagal", "Tidak dapat memilih dokumen. Coba lagi nanti.");
                }
              }}
              disabled={uploadingDocument}
            >
              {uploadingDocument ? (
                <ActivityIndicator color="#1E3A8A" />
              ) : (
                <Text style={styles.secondaryButtonText}>{documentUrl ? "Unggah Ulang Dokumen" : "Unggah Dokumen Baru"}</Text>
              )}
            </TouchableOpacity>
          ) : null}
          <Text style={styles.cardMeta}>Status dokumen: {documentStatus}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pengaturan</Text>
          <Text style={styles.sectionSubtitle}>Kelola profil, notifikasi, dan preferensi Mitra.</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push("/(mitra)/settings")}> 
            <View>
              <Text style={styles.actionTitle}>Edit Profil</Text>
              <Text style={styles.actionSubtitle}>Perbarui data perusahaan dan kontak</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert("Notifikasi", "Pengaturan notifikasi belum tersedia.")}> 
            <View>
              <Text style={styles.actionTitle}>Notifikasi</Text>
              <Text style={styles.actionSubtitle}>Kelola preferensi notifikasi</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 36 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backButton: { marginRight: 12, width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  subtitle: { color: "#64748B", marginTop: 2 },
  profileCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 14 },
  avatar: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#1E3A8A", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  name: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  role: { fontSize: 13, color: "#64748B", marginTop: 4 },
  menuCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  menuTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  menuItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  menuText: { fontSize: 14, color: "#334155" },
  valueText: { flex: 1, fontSize: 14, color: "#64748B", textAlign: "right" },
  sectionCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  sectionSubtitle: { color: "#64748B", marginBottom: 12 },
  infoCard: { backgroundColor: "#FFFFFF", borderRadius: 22, padding: 18, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 14 },
  infoTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 10 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  infoLabel: { fontSize: 14, color: "#475569" },
  infoValue: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  documentImage: { width: "100%", height: 180, borderRadius: 18, marginBottom: 12 },
  cardMeta: { color: "#475569", marginBottom: 14 },
  primaryButton: { marginTop: 8, backgroundColor: "#2563EB", paddingVertical: 14, borderRadius: 16, alignItems: "center" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
  secondaryButton: { marginTop: 10, backgroundColor: "#F8FAFC", paddingVertical: 14, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB" },
  secondaryButtonText: { color: "#0F172A", fontWeight: "700" },
  row: { padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  rowText: { color: "#0F172A", fontWeight: "700" },
  rowAction: { color: "#64748B" },
  actionRow: { padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 16, marginBottom: 10 },
  actionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  actionSubtitle: { fontSize: 13, color: "#64748B", marginTop: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  statusChip: { backgroundColor: "#E0F2FE", color: "#0369A1", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, fontSize: 12, fontWeight: "700" },
  logoutButton: { marginTop: 16, backgroundColor: "#DC2626", borderRadius: 14, padding: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  logoutText: { color: "#FFFFFF", fontWeight: "800" },
  documentButton: { marginTop: 12, backgroundColor: "#1D4ED8", borderRadius: 14, padding: 14, alignItems: "center" },
  documentButtonText: { color: "#FFFFFF", fontWeight: "800" },
  avatarContainer: { position: "relative", width: 120, height: 120, borderRadius: 24, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarImage: { width: 120, height: 120, borderRadius: 24 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 24, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  cameraButton: { position: "absolute", bottom: 8, right: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center", elevation: 2 },
});
