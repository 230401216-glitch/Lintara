import { API_BASE_URL } from "@/constants/api";
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
import { SafeAreaView } from "react-native-safe-area-context";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export default function DocumentUploadScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // nothing for now
  }, []);

  async function uploadDocument(uri: string) {
    if (!user?.token) {
      Alert.alert("Gagal", "Anda harus login untuk mengunggah dokumen.");
      return;
    }

    try {
      setUploading(true);
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

      const data = (await response.json()) as ApiResponse<{ official_document_url: string; document_status: string }>;

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Gagal mengunggah dokumen.");
      }

      setDocumentUrl(data.data?.official_document_url ?? null);
      setDocumentStatus(data.data?.document_status ?? null);
      Alert.alert("Sukses", "Dokumen resmi berhasil diunggah. Tunggu persetujuan admin.");
    } catch (error) {
      Alert.alert("Gagal", error instanceof Error ? error.message : "Gagal mengunggah dokumen.");
    } finally {
      setUploading(false);
    }
  }

  async function handlePickDocument() {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Izin ditolak", "Aplikasi membutuhkan akses galeri untuk mengunggah dokumen.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        await uploadDocument(uri);
      }
    } catch {
      Alert.alert("Gagal", "Tidak dapat memilih dokumen. Coba lagi nanti.");
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
            <Text style={styles.title}>Unggah Dokumen Mitra</Text>
            <Text style={styles.subtitle}>Unggah surat resmi travel setelah akun mitra disetujui.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.uploadPreview}>
            {documentUrl ? (
              <Image source={{ uri: documentUrl }} style={styles.uploadImage} />
            ) : (
              <Ionicons name="document-text-outline" size={52} color="#2563EB" />
            )}
          </View>
          <Text style={styles.label}>Status Dokumen</Text>
          <Text style={styles.statusText}>{documentStatus ? documentStatus.toUpperCase() : "Belum diunggah"}</Text>
          <Text style={styles.instructions}>
            Setelah upload dokumen resmi, admin akan meninjau dan menyetujui dokumen travel Anda.
          </Text>

          <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument} disabled={uploading}>
            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadButtonText}>Pilih Dokumen</Text>}
          </TouchableOpacity>
        </View>
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
  subtitle: { color: "#64748B", marginTop: 4 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  uploadPreview: { height: 220, width: "100%", borderRadius: 18, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  uploadImage: { width: "100%", height: "100%", borderRadius: 18 },
  label: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
  statusText: { fontSize: 14, color: "#334155", marginBottom: 12 },
  instructions: { fontSize: 13, color: "#64748B", lineHeight: 20, marginBottom: 18 },
  uploadButton: { backgroundColor: "#2563EB", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  uploadButtonText: { color: "#FFFFFF", fontWeight: "800" },
});
