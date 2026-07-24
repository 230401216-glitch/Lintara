import { useAuth } from "@/lib/context/AuthContext";
import {
    Feather,
    Ionicons,
    MaterialIcons,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { API_BASE_URL } from "../../constants/api";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout, approve, updatePhoto } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);
  const isMitraAccount = Boolean(
    isLoggedIn && (
      user?.role === "mitra" ||
      user?.approved ||
      user?.mitraStatus === "approved" ||
      user?.mitraStatus === "pending"
    )
  );

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        try {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            // permission denied — just ignore, user can still use placeholder
          }
        } catch {
          // ignore if ImagePicker not available
        }
      }
    })();
  }, []);

  async function handlePickAvatar() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setAvatar(uri);

        // upload to server
        try {
          const form = new FormData();
          const fileName = uri.split("/").pop() || `photo_${Date.now()}.jpg`;

          // Normalize Android content URIs
          let uploadUri = uri;
          if (Platform.OS === "android" && !uploadUri.startsWith("file://") && !uploadUri.startsWith("content://")) {
            uploadUri = `file://${uploadUri}`;
          }

          // Guess mime type from extension
          const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
          const mimeMap: any = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif" };
          const mimeType = mimeMap[ext] || "image/jpeg";

          const file = {
            uri: uploadUri,
            name: fileName,
            type: mimeType,
          } as any;

          // @ts-ignore - RN FormData
          form.append("photo", file);

          // Do NOT set Content-Type header; let fetch set the multipart boundary
          const resp = await fetch(`${API_BASE_URL}/api/auth/me/photo`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${user?.token}`,
              Accept: "application/json",
            },
            body: form,
          });

          const data = await resp.json();
          if (resp.ok && data.success) {
            updatePhoto(data.photo || data.photo);
            Alert.alert("Sukses", "Foto profil berhasil diperbarui.");
          } else {
            throw new Error(data.message || "Gagal mengunggah foto");
          }
        } catch (err) {
          console.warn(err);
          Alert.alert("Gagal", "Tidak dapat mengunggah foto. Coba lagi nanti.");
        }
      }
    } catch {
      Alert.alert("Gagal", "Tidak dapat memilih foto. Coba lagi nanti.");
    }
  }

  function handleLogout() {
    Alert.alert("Keluar", "Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: () => {
          logout();
          Alert.alert("Sukses", "Anda berhasil keluar.");
          router.replace("/");
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={70} color="#2563EB" />
          )}

          <TouchableOpacity style={styles.cameraButton} onPress={handlePickAvatar}>
            <Ionicons name="camera" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          {isLoggedIn ? (
            <>
              <Text style={styles.name}>{user?.name ?? "Pengguna"}</Text>
              <Text style={styles.email}>{user?.email ?? "-"}</Text>
              <Text style={styles.phone}>{user?.phone ?? "-"}</Text>
              <Text style={styles.statusText}>
                Status: {user?.mitraStatus === "pending"
                  ? "Menunggu Verifikasi Admin"
                  : user?.role === "mitra" || user?.approved
                    ? "Akun aktif"
                    : "Pengguna biasa"}
              </Text>
              {!user?.approved && (
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={approve}
                >
                  <Text style={styles.approveButtonText}>Minta ACC Mitra</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Keluar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.name}>Akun belum masuk</Text>
              <Text style={styles.email}>
                Silakan masuk atau daftar untuk memesan tiket.
              </Text>
              <View style={styles.authButtonsRow}>
                <TouchableOpacity
                  style={[styles.authButtonSecondary, styles.authButtonMargin]}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.authButtonSecondaryText}>Masuk</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.authButtonPrimary}
                  onPress={() => router.push("/register")}
                >
                  <Text style={styles.authButtonPrimaryText}>Daftar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.menuContainer}>
        <MenuItem
          title="Data Pribadi"
          subtitle="Kelola informasi akun Anda"
          onPress={() => router.push(isLoggedIn ? "/personal-data" : "/login")}
        />

        {!isMitraAccount ? (
          <MenuItem
            icon={<MaterialIcons name="group-add" size={22} color="#2563EB" />}
            title="⭐ Daftar Menjadi Mitra"
            subtitle="Ajukan diri sebagai partner Lintara"
            onPress={() => router.push(isLoggedIn ? "/mitra/register" : "/login")}
          />
        ) : null}


        <MenuItem
          icon={<MaterialIcons name="payment" size={22} color="#2563EB" />}
          title="Metode Pembayaran"
          subtitle="Atur pembayaran favorit"
          onPress={() => router.push({ pathname: "/account-settings", params: { mode: "payment" } })}
        />

        <MenuItem
          icon={<Feather name="shield" size={22} color="#2563EB" />}
          title="Keamanan"
          subtitle="Password dan verifikasi"
          onPress={() => router.push({ pathname: "/account-settings", params: { mode: "security" } })}
        />

        <MenuItem
          icon={<Feather name="help-circle" size={22} color="#2563EB" />}
          title="Pusat Bantuan"
          subtitle="FAQ dan dukungan pelanggan"
          onPress={() => router.push({ pathname: "/account-settings", params: { mode: "help" } })}
        />

        <MenuItem
          icon={<MaterialIcons name="report-problem" size={22} color="#2563EB" />}
          title="Laporkan Masalah"
          subtitle="Kirim keluhan atau gangguan"
          onPress={() => router.push({ pathname: "/account-settings", params: { mode: "report" } })}
        />

        {isLoggedIn ? (
          <MenuItem
            icon={<MaterialIcons name="logout" size={22} color="red" />}
            title="Keluar"
            subtitle=""
            danger
            onPress={handleLogout}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

function MenuItem({ icon, title, subtitle, danger = false, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.menuItem, danger && styles.menuItemDanger]} onPress={onPress ?? (() => Alert.alert(title))}>
      <View style={styles.menuLeft}>
        <View style={[styles.iconBox, danger && styles.iconBoxDanger]}>{icon}</View>

        <View>
          <Text style={[styles.menuTitle, danger && { color: "red" }]}>{title}</Text>
          {subtitle !== "" && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>

      <Feather name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    backgroundColor: "#2563EB",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  profileCard: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  avatarContainer: {
    position: "relative",
  },

  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  profileInfo: {
    marginLeft: 18,
    flex: 1,
  },

  authButtonsRow: {
    flexDirection: "row",
    marginTop: 12,
  },

  authButtonMargin: {
    marginRight: 10,
  },

  authButtonPrimary: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  authButtonPrimaryText: {
    color: "#2563EB",
    fontWeight: "700",
  },

  authButtonSecondary: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  logoutButton: {
    marginTop: 12,
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  logoutButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  authButtonSecondaryText: {
    color: "#fff",
    fontWeight: "700",
  },

  approveButton: {
    marginTop: 10,
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  approveButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  statusText: {
    marginTop: 8,
    color: "#2563EB",
    fontWeight: "600",
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
  },

  email: {
    color: "#666",
    marginTop: 4,
  },

  phone: {
    color: "#666",
    marginTop: 2,
  },

  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  menuItem: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  menuItemDanger: {
    backgroundColor: "#fff4f4",
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  iconBoxDanger: {
    backgroundColor: "rgba(255,230,230,1)",
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  menuSubtitle: {
    color: "#666",
    marginTop: 4,
    fontSize: 12,
  },
});
