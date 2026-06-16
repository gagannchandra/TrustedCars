import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserRole = "buyer" | "seller" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  kycStatus: "pending" | "submitted" | "approved" | "rejected";
  city: string;
  joinedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOTP: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export interface RegisterData {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
  city: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = "tc_users";
const SESSION_KEY = "tc_session";

const seedUsers: (User & { password: string })[] = [
  {
    id: "u1",
    name: "Arjun Sharma",
    email: "arjun.sharma@email.com",
    phone: "+919876543210",
    role: "buyer",
    avatar: "AS",
    isVerified: true,
    kycStatus: "approved",
    city: "Mumbai",
    joinedAt: "2024-01-15",
    password: "demo1234",
  },
  {
    id: "u2",
    name: "Priya Nair",
    email: "priya.nair@email.com",
    phone: "+919876543211",
    role: "seller",
    avatar: "PN",
    isVerified: true,
    kycStatus: "approved",
    city: "Bengaluru",
    joinedAt: "2023-08-20",
    password: "demo1234",
  },
  {
    id: "u3",
    name: "Admin User",
    email: "admin@trustedcars.in",
    phone: "+919876543212",
    role: "admin",
    avatar: "AD",
    isVerified: true,
    kycStatus: "approved",
    city: "Bengaluru",
    joinedAt: "2023-01-01",
    password: "demo1234",
  },
];

function loadUsers(): (User & { password: string })[] {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fall through
    }
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
  return seedUsers;
}

function saveUsers(users: (User & { password: string })[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate server-side session check (in production this would hit /api/auth/me)
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId) {
      const users = loadUsers();
      const found = users.find((u) => u.id === sessionId);
      if (found) {
        const { password, ...publicUser } = found;
        setUser(publicUser);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const persistSession = (u: User | null) => {
    if (u) {
      localStorage.setItem(SESSION_KEY, u.id);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    setUser(u);
  };

  const login = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 800));
    const cleanPhone = phone.replace(/\s/g, "");
    const users = loadUsers();
    const found = users.find((u) => u.phone === cleanPhone);
    
    if (!found) {
      return { success: false, error: "No account found with this phone number." };
    }
    
    if (found.password !== password) {
      return { success: false, error: "Incorrect password. Please try again." };
    }
    
    const { password: _pw, ...publicUser } = found;
    persistSession(publicUser);
    return { success: true };
  };

  const loginWithOTP = async (phone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 1000));
    const cleanPhone = phone.replace(/\s/g, "");
    const users = loadUsers();
    const found = users.find((u) => u.phone === cleanPhone);
    
    if (!found) {
      return { success: false, error: "No account found with this phone number." };
    }
    
    if (otp !== "123456") {
      return { success: false, error: "Invalid OTP. Use 123456 for demo." };
    }
    
    const { password: _pw, ...publicUser } = found;
    persistSession(publicUser);
    return { success: true };
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 1200));
    const cleanPhone = data.phone.replace(/\s/g, "");
    const users = loadUsers();
    
    if (users.some((u) => u.phone === cleanPhone)) {
      return { success: false, error: "This phone number is already registered." };
    }
    
    if (data.password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }
    
    const initials = data.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    const newUser: User & { password: string } = {
      id: `u${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: cleanPhone,
      role: data.role,
      avatar: initials,
      isVerified: true,
      kycStatus: "pending",
      city: data.city,
      joinedAt: new Date().toISOString().split("T")[0],
      password: data.password,
    };
    
    users.push(newUser);
    saveUsers(users);
    
    const { password: _pw, ...publicUser } = newUser;
    persistSession(publicUser);
    return { success: true };
  };

  const logout = () => {
    persistSession(null);
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      const users = loadUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...data };
        saveUsers(users);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithOTP,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
