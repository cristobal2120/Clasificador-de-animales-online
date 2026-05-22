import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { User, Mail, Calendar, ScanLine, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getLogs } from "../store/metricsStore";

export function ProfilePage() {
  const { user } = useAuth();
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    void getLogs().then((logs) => {
      setScanCount(logs.filter((l) => l.userId === user?.id).length);
    });
  }, [user?.id]);

  if (!user) return null;

  const rows = [
    { icon: <User size={16} />, label: "Usuario", value: user.username },
    { icon: <Mail size={16} />, label: "Email", value: user.email },
    { icon: <Calendar size={16} />, label: "Registro", value: new Date(user.createdAt).toLocaleDateString("es") },
    { icon: <ScanLine size={16} />, label: "Escaneos", value: String(scanCount) },
    { icon: <Shield size={16} />, label: "Rol", value: user.role },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto px-4 py-10"
    >
      <div
        className="rounded-3xl p-8 text-center mb-6"
        style={{
          background: "var(--app-card-bg)",
          border: "1px solid var(--app-card-border)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl"
          style={{ background: "var(--layout-profile-avatar-bg)" }}
        >
          {user.avatar}
        </div>
        <h2 className="font-display text-xl mb-1" style={{ fontWeight: 700, color: "var(--app-text)" }}>
          {user.username}
        </h2>
        <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>{user.email}</p>
      </div>

      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: "var(--app-card-bg)",
          border: "1px solid var(--app-card-border)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-center gap-3 px-5 py-4"
            style={{
              borderBottom: i < rows.length - 1 ? "1px solid var(--layout-divider)" : undefined,
            }}
          >
            <span style={{ color: "var(--layout-nav-text-active)" }}>{row.icon}</span>
            <span className="text-sm flex-1" style={{ color: "var(--app-text-muted)" }}>{row.label}</span>
            <span className="text-sm" style={{ fontWeight: 600, color: "var(--app-text)" }}>{row.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
