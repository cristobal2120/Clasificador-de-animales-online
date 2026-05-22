import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ScanLine, LogOut, Menu, X, Database, BarChart3, UserCircle, PawPrint } from "lucide-react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { AnimalScanner } from "./AnimalScanner";
import { Dashboard } from "./Dashboard";
import { ProfilePage } from "./ProfilePage";
import { AppFooter } from "./AppFooter";

type ActiveView = "scanner" | "metrics" | "profile";

interface MainLayoutProps {
  onLogout: () => void;
}

export function MainLayout({ onLogout }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>("scanner");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scanRefresh, setScanRefresh] = useState(0);
  const [dbOnline, setDbOnline] = useState<boolean | null>(null);
  const [skyDark, setSkyDark] = useState(() => {
    try {
      return localStorage.getItem("animalscan_theme") === "sky";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (skyDark) root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("animalscan_theme", skyDark ? "sky" : "light");
    } catch {
      // ignore
    }
  }, [skyDark]);

  useEffect(() => {
    void (async () => {
      try {
        await getDocs(query(collection(db, "scanLogs"), limit(1)));
        setDbOnline(true);
      } catch {
        setDbOnline(false);
      }
    })();
  }, [scanRefresh]);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const navItems = [
    { id: "scanner" as const, label: "Escáner", icon: ScanLine },
    { id: "metrics" as const, label: "Métricas", icon: BarChart3 },
    { id: "profile" as const, label: "Perfil", icon: UserCircle },
  ];

  const viewTitles: Record<ActiveView, string> = {
    scanner: "Escáner de imágenes",
    metrics: "Panel de métricas",
    profile: "Mi perfil",
  };

  const sidebarChrome = {
    surface: {
      background: "var(--layout-sidebar-bg)",
      backdropFilter: "blur(18px)",
      borderRight: "1px solid var(--layout-sidebar-border)",
      boxShadow: "var(--layout-sidebar-shadow)",
    } as const,
  };

  const renderSidebarContent = (onNav?: () => void) => (
    <>
      <div className="px-5 py-6" style={{ borderBottom: "1px solid var(--layout-divider)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "var(--app-brand-gradient)" }}>
              <PawPrint size={20} color="white" />
            </div>
            <div>
              <h1 className="font-display text-sm" style={{ fontWeight: 700, color: "var(--layout-heading)" }}>
                Clasificador
              </h1>
              <p className="text-xs" style={{ color: "var(--layout-subheading)" }}>Animales online</p>
            </div>
          </div>
          {onNav && (
            <button type="button" onClick={onNav} style={{ color: "var(--layout-subheading)" }} className="p-1 rounded-lg" aria-label="Cerrar menú">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--layout-divider)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ background: "var(--layout-profile-bg)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: "var(--layout-profile-avatar-bg)" }}>
            {user?.avatar || "👤"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate" style={{ fontWeight: 600, color: "var(--layout-heading)" }}>{user?.username}</p>
            <p className="text-xs truncate" style={{ color: "var(--layout-subheading)" }}>{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        <p className="text-xs px-3 mb-2 uppercase tracking-wider" style={{ color: "var(--layout-label)" }}>Navegación</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveView(item.id); onNav?.(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 text-left"
              style={{
                background: active ? "var(--layout-nav-active-bg)" : "transparent",
                color: active ? "var(--layout-nav-text-active)" : "var(--layout-nav-text)",
                fontWeight: active ? 600 : 500,
                border: active ? "1px solid var(--layout-nav-active-border)" : "1px solid transparent",
              }}
            >
              <Icon size={18} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-3" style={{ borderTop: "1px solid var(--layout-divider)" }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
          style={{
            background: dbOnline === false ? "rgba(239,68,68,0.08)" : "var(--layout-db-pill-bg)",
            color: dbOnline === false ? "#DC2626" : "var(--layout-db-pill-text)",
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: dbOnline === null ? "#94A3B8" : dbOnline ? "var(--layout-db-pill-text)" : "#EF4444",
            }}
          />
          <Database size={12} />
          <span>{dbOnline === null ? "Comprobando Firebase…" : dbOnline ? "Firestore conectado" : "Firestore sin conexión"}</span>
        </div>
      </div>

      <div className="px-5 pb-3">
        <button
          type="button"
          onClick={() => setSkyDark((v) => !v)}
          className="w-full px-3 py-2 rounded-xl text-xs text-left"
          style={{
            background: "var(--app-surface)",
            border: "1px solid var(--app-surface-border)",
            color: "var(--app-text)",
            fontWeight: 600,
          }}
        >
          {skyDark ? "☀️ Modo claro" : "🌙 Modo oscuro"}
        </button>
      </div>

      <div className="px-4 pb-5">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left"
          style={{ color: "var(--layout-logout-text)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--layout-logout-hover-bg)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={18} />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden flex-col" style={{ background: "var(--app-bg-gradient)" }}>
      <div className="flex flex-1 overflow-hidden min-h-0">
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 lg:hidden" style={{ background: "var(--layout-overlay)" }} onClick={() => setSidebarOpen(false)} aria-hidden />
        )}

        <motion.aside
          className="fixed lg:hidden z-30 flex-shrink-0 w-64 h-full flex flex-col"
          initial={{ x: -280 }}
          animate={{ x: sidebarOpen ? 0 : -280 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={sidebarChrome.surface}
        >
          {renderSidebarContent(() => setSidebarOpen(false))}
        </motion.aside>

        <aside className="hidden lg:flex flex-shrink-0 w-64 h-full flex-col" style={sidebarChrome.surface}>
          {renderSidebarContent()}
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div
            className="flex items-center justify-between px-4 lg:px-6 py-3 flex-shrink-0 backdrop-blur-md"
            style={{ background: "var(--layout-topbar-bg)", borderBottom: "1px solid var(--layout-topbar-border)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl"
                style={{ color: "var(--layout-nav-text)" }}
                aria-label="Abrir menú"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-xs hidden sm:block" style={{ color: "var(--layout-subheading)" }}>Clasificador de animales</p>
                <h2 className="font-display truncate text-sm sm:text-base" style={{ fontWeight: 700, color: "var(--layout-heading)" }}>
                  {viewTitles[activeView]}
                </h2>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 lg:hidden" style={{ background: "var(--layout-profile-avatar-bg)" }}>
              {user?.avatar || "👤"}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeView === "scanner" && (
                  <AnimalScanner onScanComplete={() => setScanRefresh((n) => n + 1)} />
                )}
                {activeView === "metrics" && <Dashboard embedded refreshTrigger={scanRefresh} />}
                {activeView === "profile" && <ProfilePage />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
