import { API_BASE_URL } from "@/constants/api";
import { clearBookingsCache } from "@/lib/services/bookingStore";
import * as TokenService from "@/lib/services/tokenService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

type User = {
  id?: string | number;
  name: string;
  email: string;
  phone: string;
  approved: boolean;
  photo?: string;
  provider?: "google" | "email";
  token?: string;
  role?: string;
  mitraStatus?: "pending" | "approved" | "rejected" | "none";
};

type AuthInput = {
  id?: string | number;
  name?: string;
  nama?: string;
  email: string;
  phone?: string;
  no_hp?: string;
  approved?: boolean;
  status?: string;
  photo?: string;
  foto?: string;
  provider?: "google" | "email";
  token?: string;
  role?: string;
  mitraStatus?: "pending" | "approved" | "rejected" | "none";
};

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  isReady: boolean;

  login: (data: AuthInput) => void;
  register: (data: AuthInput) => void;
  updatePhoto: (photo: string) => void;

  googleLogin: (data: {
    id?: string | number;
    nama?: string;
    name?: string;
    email: string;
    photo?: string;
    foto?: string;
    no_hp?: string;
    role?: string;
    status?: string;
    token?: string;
  }) => void;

  logout: () => void;
  approve: () => void;
  token: string | null;
  checkAuthStatus: () => Promise<boolean>;
};

const STORAGE_KEY = "lintara.auth.user.v1";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const normalizeRole = (role?: string): string | undefined => {
  if (!role) return undefined;

  const value = role.trim().toLowerCase();

  if (["admin", "administrator", "superadmin", "owner", "adm"].includes(value)) {
    return "admin";
  }

  if (["mitra", "partner", "vendor", "mitra travel"].includes(value)) {
    return "mitra";
  }

  if ([
    "user",
    "usr",
    "pengguna",
    "customer",
    "passenger",
    "penumpang",
    "member",
  ].includes(value)) {
    return "user";
  }

  return value;
};

const normalizeUser = (data: AuthInput): User => ({
  id: data.id,
  name: data.name ?? data.nama ?? "Pengguna",
  email: data.email,
  phone: data.phone ?? data.no_hp ?? "",
  approved: data.approved ?? data.status === "aktif",
  photo: data.photo ?? data.foto,
  provider: data.provider ?? "email",
  token: data.token,
  role: normalizeRole(data.role),
  mitraStatus: data.mitraStatus ?? "none",
});

type AuthProviderProps = Readonly<{
  children: ReactNode;
}>;

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load user and token from secure storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedToken = await TokenService.getToken();
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const savedUser = await TokenService.getUser();

        if (savedToken) {
          setToken(savedToken);
        }

        if (raw) {
          const parsedUser = JSON.parse(raw) as User;
          if (parsedUser && !parsedUser.token && savedToken) {
            parsedUser.token = savedToken;
          }
          setUser(parsedUser);
        } else if (savedUser) {
          const restoredUser: User = {
            id: savedUser.id,
            name: savedUser.nama ?? "Pengguna",
            email: savedUser.email,
            phone: savedUser.no_hp ?? "",
            approved: savedUser.status === "aktif",
            photo: savedUser.foto,
            provider: "email",
            role: normalizeRole(savedUser.role),
            token: savedToken ?? undefined,
            mitraStatus: "none",
          };
          setUser(restoredUser);
        }
      } catch (error) {
        console.warn("Gagal membaca sesi login", error);
      } finally {
        setIsReady(true);
      }
    };

    void loadUser();
  }, []);

  const saveUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);

    if (nextUser) {
      void AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextUser)
      );
      
      // Save token to SecureStore if present
      if (nextUser.token) {
        void TokenService.saveToken({
          token: nextUser.token,
          user: {
            id: nextUser.id ? Number(nextUser.id) : 0,
            nama: nextUser.name,
            email: nextUser.email,
            no_hp: nextUser.phone,
            role: normalizeRole(nextUser.role)?.toLowerCase() as "user" | "mitra" | "admin" | undefined,
            status: nextUser.approved ? "aktif" : "nonaktif",
            foto: nextUser.photo,
          } as any,
        });
        setToken(nextUser.token);
      }
    } else {
      void AsyncStorage.removeItem(STORAGE_KEY);
      void TokenService.clearToken();
      setToken(null);
    }
  }, []);

  const login = useCallback(
    (data: AuthInput) => {
      saveUser(normalizeUser(data));
    },
    [saveUser]
  );

  const register = useCallback(
    (data: AuthInput) => {
      saveUser(
        normalizeUser({
          ...data,
          approved: data.approved ?? true,
        })
      );
    },
    [saveUser]
  );

  const googleLogin = useCallback(
    ({
      id,
      name,
      nama,
      email,
      photo,
      foto,
      no_hp,
      role,
      status,
      token,
    }: {
      id?: string | number;
      nama?: string;
      name?: string;
      email: string;
      photo?: string;
      foto?: string;
      no_hp?: string;
      role?: string;
      status?: string;
      token?: string;
    }) => {
      saveUser({
        id,
        name: name ?? nama ?? "Pengguna",
        email,
        phone: no_hp ?? "",
        approved: status ? status === "aktif" : true,
        photo: photo ?? foto,
        provider: "google",
        token,
        role: normalizeRole(role),
      });
    },
    [saveUser]
  );

  const logout = useCallback(() => {
    saveUser(null);
    setToken(null);
    void clearBookingsCache();
  }, [saveUser]);

  const approve = useCallback(() => {
    setUser((currentUser) => {
      if (!currentUser) return null;

      const nextUser = {
        ...currentUser,
        approved: true,
      };

      void AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextUser)
      );

      return nextUser;
    });
  }, []);

  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    let authValid = false;

    try {
      const savedToken = await TokenService.getToken();
      if (!savedToken) {
        setToken(null);
        setUser(null);
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setToken(savedToken);
        const userData = data.data || data.user;
        if (userData) {
          setUser((currentUser) => ({
            ...currentUser,
            id: userData.id,
            name: userData.nama || userData.name,
            email: userData.email,
            phone: userData.no_hp || userData.phone,
            photo: userData.foto || userData.photo,
            approved: userData.status === "aktif",
            role: normalizeRole(userData.role),
            token: savedToken,
          } as User));
        }
        authValid = true;
      } else {
        await TokenService.clearToken();
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    } finally {
      setIsReady(true);
    }

    return authValid;
  }, []);

  const updatePhoto = useCallback((photo: string) => {
    setUser((currentUser) => {
      if (!currentUser) return null;

      const nextUser = {
        ...currentUser,
        photo,
      };

      void AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextUser)
      );

      return nextUser;
    });
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      isReady,
      login,
      register,
      updatePhoto,
      googleLogin,
      logout,
      approve,
      token,
      checkAuthStatus,
    }),
    [
      user,
      isReady,
      login,
      register,
      updatePhoto,
      googleLogin,
      logout,
      approve,
      token,
      checkAuthStatus,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
}