"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  email: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/local/auth/me");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/local/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-800";
      case "TRADER": return "bg-blue-100 text-blue-800";
      case "VIEWER": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Admin";
      case "TRADER": return "Trader";
      case "VIEWER": return "Viewer";
      default: return "Unknown";
    }
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-900">Spark Trading</span>
            </div>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-gray-900">Spark Trading</span>
            </div>
            <div className="flex items-center">
              <Link href="/login" className="text-blue-600 hover:text-blue-800">
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Role bazlı navigation items
  const navItems = [
    { href: "/", label: "Anasayfa", roles: ["ADMIN", "TRADER", "VIEWER"] },
    { href: "/portfoy", label: "Portföy", roles: ["ADMIN", "TRADER", "VIEWER"] },
    { href: "/strategy-lab", label: "Strategy Lab", roles: ["ADMIN", "TRADER"] },
    { href: "/live", label: "Live Trading", roles: ["ADMIN", "TRADER"] },
    { href: "/metrics", label: "Metrikler", roles: ["ADMIN", "TRADER", "VIEWER"] },
    { href: "/ayarlar", label: "Ayarlar", roles: ["ADMIN"] }
  ].filter(item => item.roles.includes(user.role));

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <span className="text-xl font-semibold text-gray-900">Spark Trading</span>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{user.email}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Çıkış
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 