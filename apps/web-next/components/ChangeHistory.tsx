"use client";
import { useState, useEffect } from "react";

interface AuditLog {
  id: string;
  actor: string;
  role: string | null;
  action: string;
  details: any;
  createdAt: string;
}

interface ChangeHistoryProps {
  userRole: string;
}

export default function ChangeHistory({ userRole }: ChangeHistoryProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userRole === "ADMIN") {
      fetchAuditLogs();
    }
  }, [userRole]);

  async function fetchAuditLogs() {
    try {
      setLoading(true);
      const response = await fetch("/api/local/audit?limit=100");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        setError("Audit log'ları yüklenemedi");
      }
    } catch (error) {
      setError("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;
    
    const colors = {
      ADMIN: "bg-red-900/20 text-red-400 border-red-800",
      TRADER: "bg-blue-900/20 text-blue-400 border-blue-800",
      VIEWER: "bg-green-900/20 text-green-400 border-green-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs border ${colors[role as keyof typeof colors] || "bg-neutral-900/20 text-neutral-400 border-neutral-800"}`}>
        {role}
      </span>
    );
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      "settings.set": "⚙️",
      "settings.delete": "🗑️",
      "login": "🔑",
      "logout": "🚪",
      "executor.sync": "🔄"
    };
    return icons[action] || "📝";
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      "settings.set": "Ayar Değiştirildi",
      "settings.delete": "Ayar Silindi",
      "login": "Giriş Yapıldı",
      "logout": "Çıkış Yapıldı",
      "executor.sync": "Executor Sync"
    };
    return labels[action] || action;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (userRole !== "ADMIN") {
    return (
      <div className="text-center py-8">
        <div className="text-neutral-400">Bu sayfaya erişim yetkiniz yok</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-neutral-400">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400">{error}</div>
        <button 
          onClick={fetchAuditLogs}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Değişiklik Geçmişi</h3>
        <button 
          onClick={fetchAuditLogs}
          className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded text-sm hover:bg-neutral-700"
        >
          Yenile
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-neutral-400">
          Henüz değişiklik kaydı yok
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left py-3 px-4 font-medium text-neutral-300">Tarih</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-300">Kullanıcı</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-300">Rol</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-300">İşlem</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-300">Detay</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/50">
                  <td className="py-3 px-4 text-neutral-400">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{log.actor}</div>
                  </td>
                  <td className="py-3 px-4">
                    {getRoleBadge(log.role)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span>{getActionIcon(log.action)}</span>
                      <span>{getActionLabel(log.action)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-neutral-400">
                    {log.details?.name ? (
                      <span className="bg-neutral-800 px-2 py-1 rounded text-xs">
                        {log.details.name}
                      </span>
                    ) : (
                      <span className="text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 