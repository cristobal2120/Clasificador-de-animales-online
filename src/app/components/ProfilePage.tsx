import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { User, Mail, Calendar, ScanLine, Shield, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getLogs } from "../store/metricsStore";
import { ScanLog } from "../types";
import { Button } from "./ui/button";

function RoleBadge({ role }: { role: "admin" | "user" }) {
  const isAdmin = role === "admin";
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
      style={{
        fontWeight: 600,
        background: isAdmin ? "rgba(79, 70, 229, 0.12)" : "var(--app-accent-soft)",
        color: isAdmin ? "#4F46E5" : "#047857",
        border: `1px solid ${isAdmin ? "rgba(79, 70, 229, 0.25)" : "rgba(5, 150, 105, 0.25)"}`,
      }}
    >
      <Shield size={12} />
      {isAdmin ? "Administrador" : "Usuario"}
    </span>
  );
}

interface ProfilePageProps {
  onGoScanner?: () => void;
}

export function ProfilePage({ onGoScanner }: ProfilePageProps) {
  const { user } = useAuth();
  const [scanCount, setScanCount] = useState<number | null>(null);
  const [recentScans, setRecentScans] = useState<ScanLog[]>([]);

  useEffect(() => {
    void getLogs().then((logs) => {
      const mine = logs.filter((l) => l.userId === user?.id);
      setScanCount(mine.length);
      setRecentScans(mine.slice(0, 3));
    });
  }, [user?.id]);

  if (!user) return null;

  const detailItems = [
    { icon: User, label: "Usuario", value: user.username },
    { icon: Mail, label: "Email", value: user.email },
    {
      icon: Calendar,
      label: "Miembro desde",
      value: new Date(user.createdAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:py-10"
    >
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: "var(--app-card-bg)",
          border: "1px solid var(--app-card-border)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <div
          className="px-6 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6"
          style={{
            background: "linear-gradient(135deg, var(--app-accent-soft) 0%, transparent 55%)",
            borderBottom: "1px solid var(--layout-divider)",
          }}
        >
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-5xl shrink-0"
            style={{
              background: "var(--layout-profile-avatar-bg)",
              border: "3px solid var(--app-surface-strong)",
              boxShadow: "var(--app-card-shadow)",
            }}
          >
            {user.avatar}
          </div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
              <h2 className="font-display text-2xl truncate" style={{ fontWeight: 700, color: "var(--app-text)" }}>
                {user.username}
              </h2>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-sm truncate mb-3" style={{ color: "var(--app-text-muted)" }}>
              {user.email}
            </p>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
              style={{
                background: "var(--app-surface-strong)",
                border: "1px solid var(--app-surface-border)",
                color: "var(--app-text-muted)",
                fontWeight: 500,
              }}
            >
              <Sparkles size={12} style={{ color: "var(--layout-nav-text-active)" }} />
              Cuenta activa
            </span>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-6" style={{ borderBottom: "1px solid var(--layout-divider)" }}>
          <div
            className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{
              background: "var(--app-brand-gradient)",
              boxShadow: "0 12px 32px -12px rgba(5, 150, 105, 0.45)",
            }}
          >
            <div className="flex items-center gap-4 flex-1">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255, 255, 0.2)" }}
              >
                <ScanLine size={28} color="white" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white/80 mb-0.5">Total de escaneos</p>
                <p className="font-display text-3xl text-white" style={{ fontWeight: 800, lineHeight: 1.1 }}>
                  {scanCount === null ? "—" : scanCount}
                </p>
                <p className="text-xs text-white/70 mt-1">Registros en Firestore</p>
              </div>
            </div>
            {onGoScanner && (
              <Button
                type="button"
                onClick={onGoScanner}
                className="rounded-xl shrink-0 focus-visible:outline focus-visible:outline-2"
                style={{
                  background: "rgba(255,255,255,0.95)",
                  color: "#047857",
                  border: "none",
                  fontWeight: 600,
                }}
              >
                Ir al escáner
                <ArrowRight size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </div>

        {recentScans.length > 0 && (
          <div className="px-6 sm:px-8 py-6" style={{ borderBottom: "1px solid var(--layout-divider)" }}>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-3"
              style={{ color: "var(--layout-label)" }}
            >
              Últimos escaneos
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentScans.map((scan) => (
                <div
                  key={scan.id + scan.timestamp}
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    background: "var(--layout-profile-bg)",
                    border: "1px solid var(--layout-divider)",
                  }}
                >
                  <span className="text-2xl">{scan.animalEmoji}</span>
                  <p className="text-sm mt-2 truncate" style={{ fontWeight: 600, color: "var(--app-text)" }}>
                    {scan.animalDetected}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--app-text-muted)" }}>
                    {new Date(scan.timestamp).toLocaleDateString("es")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 sm:px-8 py-6">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-4"
            style={{ color: "var(--layout-label)" }}
          >
            Detalles de la cuenta
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detailItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
                  style={{
                    background: "var(--layout-profile-bg)",
                    border: "1px solid var(--layout-divider)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--app-surface-strong)", color: "var(--layout-nav-text-active)" }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs mb-0.5" style={{ color: "var(--app-text-muted)" }}>
                      {item.label}
                    </p>
                    <p className="text-sm truncate" style={{ fontWeight: 600, color: "var(--app-text)" }}>
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
