import { API_ENDPOINTS } from "@/constants/api";
import { useAuth } from "@/lib/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PendingMitra = {
  id: number;
  nama: string;
  email: string;
  no_hp?: string;
  nama_perusahaan?: string;
  status?: string;
  status_verifikasi?: string;
};

type ReportData = {
  totalUsers: number;
  totalMitras: number;
  totalBookings: number;
  totalRevenue: number;
  pendingMitras: number;
  verifiedMitras: number;
  rejectedMitras: number;
  submittedDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  submittedDocumentMitras: {
    id: number;
    nama: string;
    email: string;
    no_hp?: string;
    role: string;
    status?: string;
    nama_perusahaan?: string;
    status_verifikasi?: string;
    document_status?: string;
  }[];
  latestUsers?: AdminUser[];
};

type AdminUser = {
  id: number;
  nama: string;
  email: string;
  no_hp?: string;
  role: string;
  status?: string;
  nama_perusahaan?: string;
  status_verifikasi?: string;
  document_status?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

type AdminBooking = {
  id: number;
  booking_code: string;
  total_harga: number;
  payment_status?: string;
  status_booking?: string;
  asal?: string;
  tujuan?: string;
  travel_name?: string;
  tanggal?: string;
  jam_berangkat?: string;
  kode_tiket?: string;
  seats?: string[];
};

type AdminSection = "dashboard" | "pengguna" | "mitra" | "laporan" | "pengaturan";

const authHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const [pendingMitras, setPendingMitras] = useState<PendingMitra[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [documentActionLoading, setDocumentActionLoading] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "mitra" | "user">("all");
  const [userActionLoading, setUserActionLoading] = useState<Record<number, boolean>>({});
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");

  const loadDashboardData = useCallback(async () => {
    if (!user?.token) {
      setPendingMitras([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [pendingResponse, reportsResponse, usersResponse] = await Promise.all([
        fetch(API_ENDPOINTS.getPendingMitras, {
          headers: authHeaders(user.token),
        }),
        fetch(API_ENDPOINTS.getAdminReports, {
          headers: authHeaders(user.token),
        }),
        fetch(API_ENDPOINTS.getUsers, { headers: authHeaders(user.token) }),
      ]);

      const pendingData = (await pendingResponse.json()) as ApiResponse<PendingMitra[]>;
      const reportsData = (await reportsResponse.json()) as ApiResponse<ReportData>;
      const usersData = (await usersResponse.json()) as ApiResponse<AdminUser[]>;

      if (!pendingResponse.ok || pendingData.success === false) {
        throw new Error(pendingData.message || "Gagal memuat mitra pending");
      }

      if (!reportsResponse.ok || reportsData.success === false) {
        throw new Error(reportsData.message || "Gagal memuat laporan admin");
      }

      setPendingMitras(Array.isArray(pendingData.data) ? pendingData.data : []);
      setUsersList(Array.isArray(usersData.data) ? usersData.data : []);
      setReportData(reportsData.data ?? null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Gagal memuat data dashboard admin");
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  const updateMitraStatus = async (mitra: PendingMitra, action: "approve" | "reject") => {
    try {
      setLoading(true);
      const endpoint =
        action === "approve"
          ? API_ENDPOINTS.approveMitra(String(mitra.id))
          : API_ENDPOINTS.rejectMitra(String(mitra.id));
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: authHeaders(user?.token),
      });
      const data = (await response.json()) as ApiResponse<PendingMitra>;

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Gagal memperbarui status mitra");
      }

      await loadDashboardData();
      Alert.alert("Berhasil", action === "approve" ? "Akun mitra dikonfirmasi." : "Akun mitra ditolak.");
    } catch (nextError) {
      Alert.alert("Gagal", nextError instanceof Error ? nextError.message : "Gagal memperbarui status mitra.");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = async (mitraId: number, action: "approve" | "reject") => {
    if (!user?.token) return;

    try {
      setDocumentActionLoading((prev) => ({ ...prev, [mitraId]: true }));
      const endpoint =
        action === "approve"
          ? API_ENDPOINTS.approveMitraDocument(String(mitraId))
          : API_ENDPOINTS.rejectMitraDocument(String(mitraId));

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: authHeaders(user.token),
      });
      const data = (await response.json()) as ApiResponse<null>;

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Gagal memperbarui status dokumen.");
      }

      await loadDashboardData();
      Alert.alert("Berhasil", action === "approve" ? "Dokumen mitra disetujui." : "Dokumen mitra ditolak.");
    } catch (nextError) {
      Alert.alert("Gagal", nextError instanceof Error ? nextError.message : "Gagal memperbarui status dokumen.");
    } finally {
      setDocumentActionLoading((prev) => ({ ...prev, [mitraId]: false }));
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const handleNavPress = (section: AdminSection) => {
    setActiveSection(section);

    if (section === "pengguna") {
      setFilterRole("user");
      return;
    }

    if (section === "mitra") {
      setFilterRole("mitra");
      return;
    }

    if (section === "pengaturan") {
      setSearchQuery("");
    }
  };

  const handleMitraCooperationPayment = (mitra: PendingMitra | { nama: string; email: string; nama_perusahaan?: string }) => {
    Alert.alert(
      "Pembayaran Kerja Sama Mitra",
      `${mitra.nama_perusahaan || `${mitra.nama} Travel`} perlu menyelesaikan pembayaran kerja sama sebelum akun dikonfirmasi. Setelah pembayaran diterima, admin dapat klik Konfirmasi pada tabel Mitra.`
    );
  };

  const viewUser = async (userId: number) => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.getUser(String(userId)), { headers: authHeaders(user.token) });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Gagal memuat pengguna");
      setSelectedUser(json.data ?? null);
      setEditing(false);
    } catch (err) {
      Alert.alert("Gagal", err instanceof Error ? err.message : "Gagal memuat pengguna");
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async () => {
    if (!user?.token || !selectedUser) return;
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.updateUser(String(selectedUser.id)), {
        method: "PUT",
        headers: authHeaders(user.token),
        body: JSON.stringify({ nama: selectedUser.nama, email: selectedUser.email, no_hp: selectedUser.no_hp, status: selectedUser.status }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Gagal menyimpan pengguna");
      Alert.alert("Berhasil", "Perubahan pengguna disimpan");
      setSelectedUser(json.data ?? null);
      setEditing(false);
      await loadDashboardData();
    } catch (err) {
      Alert.alert("Gagal", err instanceof Error ? err.message : "Gagal menyimpan pengguna");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number, targetStatus: string) => {
    if (!user?.token) return;
    try {
      setUserActionLoading((s) => ({ ...s, [userId]: true }));
      const res = await fetch(API_ENDPOINTS.updateUser(String(userId)), {
        method: "PUT",
        headers: authHeaders(user.token),
        body: JSON.stringify({ status: targetStatus }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Gagal mengubah status pengguna");
      Alert.alert("Berhasil", `Status pengguna diubah menjadi ${targetStatus}`);
      await loadDashboardData();
    } catch (err) {
      Alert.alert("Gagal", err instanceof Error ? err.message : "Gagal mengubah status pengguna");
    } finally {
      setUserActionLoading((s) => ({ ...s, [userId]: false }));
    }
  };

  const deleteUser = async (userId: number) => {
    if (!user?.token) return;
    Alert.alert("Konfirmasi", "Hapus pengguna ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            setUserActionLoading((s) => ({ ...s, [userId]: true }));
            const res = await fetch(API_ENDPOINTS.deleteUser(String(userId)), {
              method: "DELETE",
              headers: authHeaders(user.token),
            });
            const json = await res.json();
            if (!res.ok || json.success === false) throw new Error(json.message || "Gagal menghapus pengguna");
            Alert.alert("Berhasil", "Pengguna dihapus");
            setSelectedUser(null);
            await loadDashboardData();
          } catch (err) {
            Alert.alert("Gagal", err instanceof Error ? err.message : "Gagal menghapus pengguna");
          } finally {
            setUserActionLoading((s) => ({ ...s, [userId]: false }));
          }
        },
      },
    ]);
  };

  const isWide = width >= 900;
  const filteredPendingMitras = pendingMitras
    .filter(() => filterRole !== "user")
    .filter((mitra) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(mitra.nama || "").toLowerCase().includes(q) ||
        String(mitra.email || "").toLowerCase().includes(q) ||
        String(mitra.nama_perusahaan || "").toLowerCase().includes(q)
      );
    });
  const totalUsers = reportData?.totalUsers ?? 0;
  const totalMitras = reportData?.totalMitras ?? pendingMitras.length;
  const totalBookings = reportData?.totalBookings ?? 0;
  const totalRevenue = reportData?.totalRevenue ?? 0;
  const submittedDocumentMitras = reportData?.submittedDocumentMitras ?? [];
  const latestUsers = reportData?.latestUsers ?? [];
  const filteredUsers = usersList.filter((userItem) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(userItem.nama || "").toLowerCase().includes(q) ||
      String(userItem.email || "").toLowerCase().includes(q) ||
      String(userItem.role || "").toLowerCase().includes(q) ||
      String(userItem.nama_perusahaan || "").toLowerCase().includes(q)
    );
  });
  const allMitraRows = [
    ...usersList
      .filter((userItem) => String(userItem.role || "").toLowerCase() === "mitra")
      .map((mitra) => ({
        id: mitra.id,
        nama: mitra.nama,
        email: mitra.email,
        no_hp: mitra.no_hp,
        nama_perusahaan: mitra.nama_perusahaan,
        status: mitra.status,
        status_verifikasi: mitra.status_verifikasi,
        document_status: mitra.document_status,
      })),
    ...pendingMitras,
  ].filter((mitra, index, list) => list.findIndex((item) => item.id === mitra.id) === index);
  const filteredMitraRows = allMitraRows.filter((mitra) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(mitra.nama || "").toLowerCase().includes(q) ||
      String(mitra.email || "").toLowerCase().includes(q) ||
      String(mitra.nama_perusahaan || "").toLowerCase().includes(q)
    );
  });
  const mitraRows = [
    ...usersList
      .filter((userItem) => String(userItem.role || "").toLowerCase() === "mitra")
      .map((mitra) => ({
        id: mitra.id,
        nama: mitra.nama,
        title: mitra.nama_perusahaan || `${mitra.nama} Travel`,
        subtitle: mitra.email,
        meta: mitra.status_verifikasi || mitra.status || "Pending",
      })),
    ...submittedDocumentMitras.map((mitra) => ({
      id: mitra.id,
      nama: mitra.nama,
      title: mitra.nama_perusahaan || `${mitra.nama} Travel`,
      subtitle: mitra.email,
      meta: mitra.status_verifikasi || mitra.document_status || "Dokumen diajukan",
    })),
  ].slice(0, 5);

  const formatCurrency = (value: number) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
  const formatRevenue = (value: number) => {
    if (value >= 1000000000) return `Rp ${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}M`;
    return formatCurrency(value);
  };
  const sectionTitle = {
    dashboard: "Dashboard",
    pengguna: "Data Pengguna",
    mitra: "Data Mitra",
    laporan: "Laporan & Dokumen",
    pengaturan: "Pengaturan",
  }[activeSection];

  useFocusEffect(
    useCallback(() => {
      void loadDashboardData();
    }, [loadDashboardData])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.shell, !isWide && styles.shellMobile]}>
        <View style={[styles.sidebar, !isWide && styles.sidebarMobile]}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandTitle}>Lintara</Text>
            <Text style={styles.brandSubtitle}>Admin Dashboard</Text>
          </View>
          <View style={[styles.navList, !isWide && styles.navListMobile]}>
            <TouchableOpacity style={[styles.navItem, activeSection === "dashboard" && styles.navItemActive]} onPress={() => handleNavPress("dashboard")}>
              <Text style={[styles.navText, styles.navTextActive]}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navItem, activeSection === "pengguna" && styles.navItemActive]} onPress={() => handleNavPress("pengguna")}>
              <Text style={styles.navText}>Pengguna</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navItem, activeSection === "mitra" && styles.navItemActive]} onPress={() => handleNavPress("mitra")}>
              <Text style={styles.navText}>Mitra</Text>
            </TouchableOpacity>
            {/* Transaksi disembunyikan dari admin - hanya mitra yang mengakses transaksi */}
            <TouchableOpacity style={[styles.navItem, activeSection === "laporan" && styles.navItemActive]} onPress={() => handleNavPress("laporan")}>
              <Text style={styles.navText}>Laporan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navItem, activeSection === "pengaturan" && styles.navItemActive]} onPress={() => handleNavPress("pengaturan")}>
              <Text style={styles.navText}>Pengaturan</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.main}>
          <View style={[styles.topbar, !isWide && styles.topbarMobile]}>
            <View>
              <Text style={styles.title}>{sectionTitle}</Text>
              <Text style={styles.subtitle}>Selamat datang kembali, {user?.name ?? user?.email ?? "Admin"}</Text>
            </View>
            <View style={styles.topbarActions}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={22} color="#94A3B8" />
                <TextInput
                  placeholder="Cari..."
                  placeholderTextColor="#7C8798"
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
                <Ionicons name="people-outline" size={25} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {loading ? <ActivityIndicator color="#2563EB" style={styles.loader} /> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={[styles.statsGrid, !isWide && styles.statsGridMobile]}>
              <TouchableOpacity style={styles.statCard} onPress={() => handleNavPress("pengguna")}>
                <View style={styles.statTop}>
                  <View style={[styles.statIcon, styles.statIconBlue]}>
                    <Ionicons name="people-outline" size={28} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statChange}>+12.5%</Text>
                </View>
                <Text style={styles.statValue}>{totalUsers.toLocaleString("id-ID")}</Text>
                <Text style={styles.statLabel}>Total Pengguna</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statCard} onPress={() => handleNavPress("mitra")}>
                <View style={styles.statTop}>
                  <View style={[styles.statIcon, styles.statIconGreen]}>
                    <Ionicons name="business-outline" size={28} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statChange}>+8.2%</Text>
                </View>
                <Text style={styles.statValue}>{totalMitras.toLocaleString("id-ID")}</Text>
                <Text style={styles.statLabel}>Total Mitra</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statCard} onPress={() => handleNavPress("laporan")}>
                <View style={styles.statTop}>
                  <View style={[styles.statIcon, styles.statIconOrange]}>
                    <Ionicons name="cash-outline" size={28} color="#FFFFFF" />
                  </View>
                  <Text style={styles.statChange}>+23.1%</Text>
                </View>
                <Text style={styles.statValue}>{formatRevenue(totalRevenue)}</Text>
                <Text style={styles.statLabel}>Pendapatan</Text>
              </TouchableOpacity>
            </View>

            {activeSection === "dashboard" ? (
            <View style={[styles.dashboardGrid, !isWide && styles.dashboardGridMobile]}>
              <View style={styles.panelSide}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Mitra Terdaftar</Text>
                </View>
                <View style={styles.sideTableHeader}>
                  <Text style={[styles.tableHead, styles.sideColName]}>MITRA</Text>
                  <Text style={[styles.tableHead, styles.sideColAction]}>AKSI</Text>
                </View>
                {mitraRows.length > 0 ? (
                  mitraRows.map((mitra) => (
                    <TouchableOpacity
                      key={`${mitra.id}-${mitra.title}`}
                      style={styles.operatorItem}
                      onPress={() => router.push(`/(admin)/mitra-review?id=${mitra.id}`)}
                    >
                      <View style={styles.operatorIcon}>
                        <Ionicons name="business-outline" size={26} color="#FFFFFF" />
                      </View>
                      <View style={styles.operatorCopy}>
                        <Text style={styles.operatorName}>{mitra.title}</Text>
                        <Text style={styles.operatorCity}>{mitra.subtitle}</Text>
                        <Text style={styles.operatorMeta}>{mitra.meta}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#64748B" />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={[styles.emptyText, styles.sideEmptyText]}>Belum ada mitra untuk ditampilkan.</Text>
                )}
              </View>
            </View>
            ) : null}

            {activeSection === "dashboard" ? (
            <View style={[styles.reviewGrid, !isWide && styles.reviewGridMobile]}>
              <View style={styles.panelCard}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Data Mitra</Text>
                  <TouchableOpacity style={styles.refreshButton} onPress={loadDashboardData} disabled={loading}>
                    <Ionicons name="refresh" size={16} color="#2563EB" />
                    <Text style={styles.refreshText}>Segarkan</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.dataTable}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHead, styles.mitraColCompany]}>NAMA MITRA</Text>
                      <Text style={[styles.tableHead, styles.mitraColContact]}>KONTAK</Text>
                      <Text style={[styles.tableHead, styles.mitraColStatus]}>STATUS</Text>
                      <Text style={[styles.tableHead, styles.mitraColPayment]}>KERJA SAMA</Text>
                      <Text style={[styles.tableHead, styles.mitraColAction]}>AKSI</Text>
                    </View>
                    {filteredPendingMitras.map((mitra) => (
                      <View key={mitra.id} style={styles.compactTableRow}>
                        <View style={styles.mitraColCompany}>
                          <Text style={styles.tableCellStrong}>{mitra.nama_perusahaan || `${mitra.nama} Travel`}</Text>
                          <Text style={styles.tableSub}>{mitra.nama}</Text>
                        </View>
                        <View style={styles.mitraColContact}>
                          <Text style={styles.tableCell}>{mitra.email}</Text>
                          <Text style={styles.tableSub}>{mitra.no_hp || "-"}</Text>
                        </View>
                        <View style={styles.mitraColStatus}>
                          <Text style={styles.statusPill}>{mitra.status_verifikasi || mitra.status || "pending"}</Text>
                        </View>
                        <View style={styles.mitraColPayment}>
                          <TouchableOpacity style={styles.paymentButton} onPress={() => handleMitraCooperationPayment(mitra)}>
                            <Ionicons name="card-outline" size={15} color="#155BFF" />
                            <Text style={styles.paymentButtonText}>Instruksi Bayar</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.mitraColAction}>
                          <TouchableOpacity style={styles.detailButton} onPress={() => router.push(`/(admin)/mitra-review?id=${mitra.id}`)}>
                            <Text style={styles.detailText}>Tinjau</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.approveButton} onPress={() => updateMitraStatus(mitra, "approve")} disabled={loading}>
                            <Text style={styles.approveText}>Konfirmasi</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.rejectButton} onPress={() => updateMitraStatus(mitra, "reject")} disabled={loading}>
                            <Text style={styles.rejectText}>Tolak</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                {!loading && !error && filteredPendingMitras.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="checkmark-circle-outline" size={34} color="#16A34A" />
                    <Text style={styles.emptyTitle}>Tidak ada mitra pending</Text>
                    <Text style={styles.emptyText}>Semua pendaftaran mitra sudah diproses.</Text>
                  </View>
                ) : null}
              </View>

              {reportData ? (
                <View style={styles.panelCard}>
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle}>Dokumen Mitra Diajukan</Text>
                  </View>
                  <View style={styles.miniStatsRow}>
                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>{reportData.submittedDocuments}</Text>
                      <Text style={styles.miniStatLabel}>Diajukan</Text>
                    </View>
                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>{reportData.approvedDocuments}</Text>
                      <Text style={styles.miniStatLabel}>Disetujui</Text>
                    </View>
                    <View style={styles.miniStat}>
                      <Text style={styles.miniStatValue}>{reportData.rejectedDocuments}</Text>
                      <Text style={styles.miniStatLabel}>Ditolak</Text>
                    </View>
                  </View>
                  {submittedDocumentMitras.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.documentTable}>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.tableHead, styles.docColMitra]}>MITRA</Text>
                          <Text style={[styles.tableHead, styles.docColContact]}>EMAIL</Text>
                          <Text style={[styles.tableHead, styles.docColStatus]}>DOKUMEN</Text>
                          <Text style={[styles.tableHead, styles.docColAction]}>AKSI</Text>
                        </View>
                        {submittedDocumentMitras.map((mitraItem) => (
                          <View key={mitraItem.id} style={styles.compactTableRow}>
                            <View style={styles.docColMitra}>
                              <Text style={styles.tableCellStrong}>{mitraItem.nama_perusahaan || `${mitraItem.nama} Travel`}</Text>
                              <Text style={styles.tableSub}>{mitraItem.nama}</Text>
                            </View>
                            <Text style={[styles.tableCell, styles.docColContact]}>{mitraItem.email}</Text>
                            <View style={styles.docColStatus}>
                              <Text style={styles.statusPill}>{mitraItem.document_status?.toUpperCase() || "SUBMITTED"}</Text>
                            </View>
                            <View style={styles.docColAction}>
                              <TouchableOpacity style={styles.detailButton} onPress={() => router.push(`/(admin)/mitra-review?id=${mitraItem.id}`)}>
                                <Text style={styles.detailText}>Lihat</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.approveButton}
                                onPress={() => void handleDocumentAction(mitraItem.id, "approve")}
                                disabled={Boolean(documentActionLoading[mitraItem.id])}
                              >
                                <Text style={styles.approveText}>Setujui</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.rejectButton}
                                onPress={() => void handleDocumentAction(mitraItem.id, "reject")}
                                disabled={Boolean(documentActionLoading[mitraItem.id])}
                              >
                                <Text style={styles.rejectText}>Tolak</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  ) : (
                    <Text style={styles.emptyText}>Tidak ada dokumen mitra yang perlu ditinjau saat ini.</Text>
                  )}
                </View>
              ) : null}
            </View>
            ) : null}

            {activeSection === "pengguna" ? (
              <View style={styles.panelCard}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Data Pengguna</Text>
                  <TouchableOpacity style={styles.refreshButton} onPress={loadDashboardData} disabled={loading}>
                    <Ionicons name="refresh" size={16} color="#2563EB" />
                    <Text style={styles.refreshText}>Segarkan</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.userTable}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHead, styles.userColName]}>NAMA</Text>
                      <Text style={[styles.tableHead, styles.userColEmail]}>EMAIL</Text>
                      <Text style={[styles.tableHead, styles.userColPhone]}>NO HP</Text>
                      <Text style={[styles.tableHead, styles.userColRole]}>ROLE</Text>
                      <Text style={[styles.tableHead, styles.userColStatus]}>STATUS</Text>
                    </View>
                    {filteredUsers.map((userItem) => (
                      <View key={userItem.id} style={styles.compactTableRow}>
                        <View style={styles.userColName}>
                          <Text style={styles.tableCellStrong}>{userItem.nama}</Text>
                          {userItem.nama_perusahaan ? <Text style={styles.tableSub}>{userItem.nama_perusahaan}</Text> : null}
                        </View>
                        <Text style={[styles.tableCell, styles.userColEmail]}>{userItem.email}</Text>
                        <Text style={[styles.tableCell, styles.userColPhone]}>{userItem.no_hp || "-"}</Text>
                        <View style={styles.userColRole}>
                          <Text style={styles.statusPill}>{userItem.role?.toUpperCase() || "-"}</Text>
                        </View>
                        <Text style={[styles.tableCell, styles.userColStatus]}>{userItem.status || "-"}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                {!loading && filteredUsers.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Data pengguna belum tersedia</Text>
                    <Text style={styles.emptyText}>Data pengguna mengikuti respons laporan admin dari database.</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {activeSection === "mitra" ? (
              <View style={styles.panelCard}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Data Mitra</Text>
                  <TouchableOpacity style={styles.refreshButton} onPress={loadDashboardData} disabled={loading}>
                    <Ionicons name="refresh" size={16} color="#2563EB" />
                    <Text style={styles.refreshText}>Segarkan</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.dataTable}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHead, styles.mitraColCompany]}>NAMA MITRA</Text>
                      <Text style={[styles.tableHead, styles.mitraColContact]}>KONTAK</Text>
                      <Text style={[styles.tableHead, styles.mitraColStatus]}>STATUS</Text>
                      <Text style={[styles.tableHead, styles.mitraColPayment]}>KERJA SAMA</Text>
                      <Text style={[styles.tableHead, styles.mitraColAction]}>AKSI</Text>
                    </View>
                    {filteredMitraRows.map((mitra) => (
                      <View key={mitra.id} style={styles.compactTableRow}>
                        <View style={styles.mitraColCompany}>
                          <Text style={styles.tableCellStrong}>{mitra.nama_perusahaan || `${mitra.nama} Travel`}</Text>
                          <Text style={styles.tableSub}>{mitra.nama}</Text>
                        </View>
                        <View style={styles.mitraColContact}>
                          <Text style={styles.tableCell}>{mitra.email}</Text>
                          <Text style={styles.tableSub}>{mitra.no_hp || "-"}</Text>
                        </View>
                        <View style={styles.mitraColStatus}>
                          <Text style={styles.statusPill}>{mitra.status_verifikasi || mitra.status || "pending"}</Text>
                        </View>
                        <View style={styles.mitraColPayment}>
                          <TouchableOpacity style={styles.paymentButton} onPress={() => handleMitraCooperationPayment(mitra)}>
                            <Ionicons name="card-outline" size={15} color="#155BFF" />
                            <Text style={styles.paymentButtonText}>Instruksi Bayar</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.mitraColAction}>
                          <TouchableOpacity style={styles.detailButton} onPress={() => router.push(`/(admin)/mitra-review?id=${mitra.id}`)}>
                            <Text style={styles.detailText}>Tinjau</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.approveButton} onPress={() => updateMitraStatus(mitra, "approve")} disabled={loading}>
                            <Text style={styles.approveText}>Konfirmasi</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.rejectButton} onPress={() => updateMitraStatus(mitra, "reject")} disabled={loading}>
                            <Text style={styles.rejectText}>Tolak</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                {!loading && filteredMitraRows.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Data mitra belum tersedia</Text>
                    <Text style={styles.emptyText}>Data mitra akan muncul setelah database mengirim akun mitra.</Text>
                  </View>
                ) : null}
              </View>
            ) : null}


            {activeSection === "laporan" ? (
              <View style={styles.panelCard}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Laporan & Dokumen</Text>
                  <TouchableOpacity style={styles.refreshButton} onPress={loadDashboardData} disabled={loading}>
                    <Ionicons name="refresh" size={16} color="#2563EB" />
                    <Text style={styles.refreshText}>Segarkan</Text>
                  </TouchableOpacity>
                </View>
                {reportData ? (
                  <>
                    <View style={styles.miniStatsRow}>
                      <View style={styles.miniStat}>
                        <Text style={styles.miniStatValue}>{reportData.pendingMitras}</Text>
                        <Text style={styles.miniStatLabel}>Mitra Pending</Text>
                      </View>
                      <View style={styles.miniStat}>
                        <Text style={styles.miniStatValue}>{reportData.verifiedMitras}</Text>
                        <Text style={styles.miniStatLabel}>Mitra Verified</Text>
                      </View>
                      <View style={styles.miniStat}>
                        <Text style={styles.miniStatValue}>{reportData.submittedDocuments}</Text>
                        <Text style={styles.miniStatLabel}>Dokumen Masuk</Text>
                      </View>
                      <View style={styles.miniStat}>
                        <Text style={styles.miniStatValue}>{reportData.rejectedDocuments}</Text>
                        <Text style={styles.miniStatLabel}>Dokumen Ditolak</Text>
                      </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.documentTable}>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.tableHead, styles.docColMitra]}>MITRA</Text>
                          <Text style={[styles.tableHead, styles.docColContact]}>EMAIL</Text>
                          <Text style={[styles.tableHead, styles.docColStatus]}>DOKUMEN</Text>
                          <Text style={[styles.tableHead, styles.docColAction]}>AKSI</Text>
                        </View>
                        {submittedDocumentMitras.map((mitraItem) => (
                          <View key={mitraItem.id} style={styles.compactTableRow}>
                            <View style={styles.docColMitra}>
                              <Text style={styles.tableCellStrong}>{mitraItem.nama_perusahaan || `${mitraItem.nama} Travel`}</Text>
                              <Text style={styles.tableSub}>{mitraItem.nama}</Text>
                            </View>
                            <Text style={[styles.tableCell, styles.docColContact]}>{mitraItem.email}</Text>
                            <View style={styles.docColStatus}>
                              <Text style={styles.statusPill}>{mitraItem.document_status?.toUpperCase() || "SUBMITTED"}</Text>
                            </View>
                            <View style={styles.docColAction}>
                              <TouchableOpacity style={styles.detailButton} onPress={() => router.push(`/(admin)/mitra-review?id=${mitraItem.id}`)}>
                                <Text style={styles.detailText}>Lihat</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.approveButton}
                                onPress={() => void handleDocumentAction(mitraItem.id, "approve")}
                                disabled={Boolean(documentActionLoading[mitraItem.id])}
                              >
                                <Text style={styles.approveText}>Setujui</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.rejectButton}
                                onPress={() => void handleDocumentAction(mitraItem.id, "reject")}
                                disabled={Boolean(documentActionLoading[mitraItem.id])}
                              >
                                <Text style={styles.rejectText}>Tolak</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                    {submittedDocumentMitras.length === 0 ? (
                      <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Tidak ada dokumen masuk</Text>
                        <Text style={styles.emptyText}>Dokumen mitra yang diajukan akan tampil di tabel ini.</Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Laporan belum tersedia</Text>
                    <Text style={styles.emptyText}>Klik segarkan untuk mengambil laporan dari database.</Text>
                  </View>
                )}
              </View>
            ) : null}

            {activeSection === "pengaturan" ? (
              <View style={styles.panelCard}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Pengaturan Admin</Text>
                </View>
                <View style={styles.settingsGrid}>
                  <TouchableOpacity style={styles.settingsAction} onPress={loadDashboardData} disabled={loading}>
                    <Ionicons name="refresh" size={24} color="#2563EB" />
                    <View>
                      <Text style={styles.settingsTitle}>Segarkan Data</Text>
                      <Text style={styles.settingsText}>Ambil ulang pengguna, mitra, transaksi, dan laporan dari database.</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.settingsAction} onPress={() => router.push("/(admin)/reports")}>
                    <Ionicons name="document-text-outline" size={24} color="#2563EB" />
                    <View>
                      <Text style={styles.settingsTitle}>Laporan Lengkap</Text>
                      <Text style={styles.settingsText}>Buka halaman laporan admin yang sudah tersedia.</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.settingsAction} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#DC2626" />
                    <View>
                      <Text style={styles.settingsTitle}>Keluar</Text>
                      <Text style={styles.settingsText}>Logout dari sesi admin saat ini.</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F8" },
  shell: { flex: 1, flexDirection: "row", backgroundColor: "#F4F6F8" },
  shellMobile: { flexDirection: "column" },
  sidebar: { width: 320, backgroundColor: "#1F5CEF", paddingHorizontal: 30, paddingTop: 32 },
  sidebarMobile: { width: "100%", paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16 },
  brandBlock: { marginBottom: 40 },
  brandTitle: { color: "#FFFFFF", fontSize: 30, fontWeight: "900" },
  brandSubtitle: { color: "#E8EEFF", fontSize: 18, marginTop: 6 },
  navList: { gap: 12 },
  navListMobile: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  navItem: { borderRadius: 16, paddingHorizontal: 20, paddingVertical: 17 },
  navItemActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  navText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  navTextActive: { color: "#FFFFFF" },
  main: { flex: 1, minWidth: 0 },
  topbar: {
    minHeight: 108,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 40,
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  topbarMobile: { alignItems: "flex-start", flexDirection: "column", paddingHorizontal: 18 },
  title: { fontSize: 30, fontWeight: "900", color: "#0B1220" },
  subtitle: { color: "#334155", fontSize: 18, marginTop: 6 },
  topbarActions: { flexDirection: "row", alignItems: "center", gap: 20 },
  searchBox: {
    width: 320,
    maxWidth: "100%",
    height: 54,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: { flex: 1, color: "#0F172A", fontSize: 18 },
  profileButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1F5CEF",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 40, paddingBottom: 48 },
  loader: { marginBottom: 12 },
  errorText: {
    color: "#B91C1C",
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    textAlign: "center",
  },
  statsGrid: { flexDirection: "row", gap: 30, marginBottom: 40 },
  statsGridMobile: { flexDirection: "column", gap: 14 },
  statCard: {
    flex: 1,
    minHeight: 218,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 },
  statIcon: { width: 60, height: 60, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  statIconBlue: { backgroundColor: "#2F76F6" },
  statIconGreen: { backgroundColor: "#06C755" },
  statIconPurple: { backgroundColor: "#B243F0" },
  statIconOrange: { backgroundColor: "#FF650A" },
  statChange: { color: "#00A23A", fontSize: 16, fontWeight: "800" },
  statValue: { color: "#071226", fontSize: 38, fontWeight: "900", marginBottom: 6 },
  statLabel: { color: "#334155", fontSize: 17 },
  dashboardGrid: { flexDirection: "row", gap: 28, alignItems: "flex-start" },
  dashboardGridMobile: { flexDirection: "column" },
  panelLarge: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  panelSide: {
    width: 324,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingBottom: 18,
  },
  panelCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  panelHeader: {
    minHeight: 96,
    paddingHorizontal: 30,
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  panelTitle: { color: "#071226", fontSize: 23, fontWeight: "900" },
  panelLink: { color: "#155BFF", fontSize: 16, fontWeight: "800" },
  tableHeader: {
    minHeight: 48,
    backgroundColor: "#F7F8FA",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  tableRow: {
    minHeight: 112,
    paddingHorizontal: 30,
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  tableHead: { color: "#334155", fontSize: 14, fontWeight: "700" },
  tableCell: { color: "#334155", fontSize: 16, lineHeight: 24 },
  tableCellStrong: { color: "#071226", fontSize: 16, fontWeight: "900", lineHeight: 24 },
  tableSub: { color: "#64748B", fontSize: 14, marginTop: 3 },
  colId: { flex: 0.9, minWidth: 72 },
  colUser: { flex: 1.2, minWidth: 118 },
  colOperator: { flex: 1.2, minWidth: 96 },
  colRoute: { flex: 1.4, minWidth: 120 },
  colAmount: { flex: 1, minWidth: 104, textAlign: "right" },
  operatorItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 30, paddingVertical: 14, gap: 20 },
  operatorIcon: { width: 60, height: 60, borderRadius: 16, backgroundColor: "#2F76F6", alignItems: "center", justifyContent: "center" },
  operatorCopy: { flex: 1, minWidth: 0 },
  operatorName: { color: "#071226", fontSize: 19, fontWeight: "900" },
  operatorCity: { color: "#64748B", fontSize: 16, marginTop: 4 },
  operatorMeta: { color: "#334155", fontSize: 13, marginTop: 6 },
  sideTableHeader: {
    minHeight: 44,
    paddingHorizontal: 30,
    backgroundColor: "#F7F8FA",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EEF2F7",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sideColName: { flex: 1 },
  sideColAction: { width: 44, textAlign: "right" },
  sideEmptyText: { paddingHorizontal: 30, paddingVertical: 18 },
  reviewGrid: { flexDirection: "row", gap: 28, marginTop: 28, alignItems: "flex-start" },
  reviewGridMobile: { flexDirection: "column" },
  refreshButton: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EFF6FF", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  refreshText: { color: "#2563EB", fontWeight: "800" },
  dataTable: { minWidth: 900, width: "100%" },
  documentTable: { minWidth: 760, width: "100%" },
  userTable: { minWidth: 820, width: "100%" },
  transactionTable: { minWidth: 1060, width: "100%" },
  compactTableRow: {
    minHeight: 78,
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  mitraColCompany: { width: 190 },
  mitraColContact: { width: 220 },
  mitraColStatus: { width: 130 },
  mitraColPayment: { width: 170 },
  mitraColAction: { width: 260, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  docColMitra: { width: 190 },
  docColContact: { width: 220 },
  docColStatus: { width: 130 },
  docColAction: { width: 260, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  userColName: { width: 190 },
  userColEmail: { width: 260 },
  userColPhone: { width: 140 },
  userColRole: { width: 110 },
  userColStatus: { width: 120 },
  trxColId: { width: 150 },
  trxColMitra: { width: 190 },
  trxColRoute: { width: 190 },
  trxColDate: { width: 130 },
  trxColStatus: { width: 130 },
  trxColAmount: { width: 140, textAlign: "right" },
  trxColAction: { width: 90, flexDirection: "row", justifyContent: "flex-end" },
  statusPill: {
    alignSelf: "flex-start",
    overflow: "hidden",
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: "900",
  },
  paymentButton: {
    alignSelf: "flex-start",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  paymentButtonText: { color: "#155BFF", fontSize: 12, fontWeight: "900" },
  reviewItem: {
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  reviewItemCompact: {
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    gap: 14,
  },
  reviewAvatar: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  reviewAvatarText: { color: "#1D4ED8", fontSize: 18, fontWeight: "900" },
  reviewCopy: { flex: 1, minWidth: 0 },
  reviewTitle: { color: "#071226", fontSize: 17, fontWeight: "900" },
  reviewMeta: { color: "#64748B", fontSize: 13, marginTop: 4 },
  reviewActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" },
  approveButton: { backgroundColor: "#16A34A", borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  approveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  detailButton: { backgroundColor: "#2563EB", borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  detailText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  rejectButton: { backgroundColor: "#FEE2E2", borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  rejectText: { color: "#DC2626", fontSize: 12, fontWeight: "900" },
  emptyInline: { padding: 30 },
  emptyCard: { padding: 30, alignItems: "center", borderTopWidth: 1, borderTopColor: "#EEF2F7" },
  emptyTitle: { color: "#071226", fontSize: 17, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#64748B", fontSize: 14, lineHeight: 20 },
  miniStatsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 30, paddingBottom: 18 },
  miniStat: { flex: 1, backgroundColor: "#F8FAFC", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#E2E8F0" },
  miniStatValue: { color: "#071226", fontSize: 22, fontWeight: "900" },
  miniStatLabel: { color: "#64748B", fontSize: 12, marginTop: 3 },
  badgeText: {
    alignSelf: "flex-start",
    overflow: "hidden",
    marginTop: 10,
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "900",
  },
  documentActions: { flexDirection: "row", gap: 8 },
  settingsGrid: { paddingHorizontal: 30, paddingBottom: 30, gap: 12 },
  settingsAction: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  settingsTitle: { color: "#071226", fontSize: 16, fontWeight: "900" },
  settingsText: { color: "#64748B", fontSize: 13, marginTop: 3, maxWidth: 620 },
});
