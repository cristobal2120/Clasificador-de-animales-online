import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ScanLine, LogOut, Menu, X, Database, UserCircle, PawPrint, Sun, Moon } from "lucide-react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { AnimalScanner } from "./AnimalScanner";
import { ProfilePage } from "./ProfilePage";
import { AppFooter } from "./AppFooter";

type ActiveView = "scanner" | "profile";

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
    { id: "scanner" as const, label: "Escáner", desc: "Identificar animales", icon: ScanLine },
    { id: "profile" as const, label: "Perfil", desc: "Tu cuenta", icon: UserCircle },
  ];

  const viewTitles: Record<ActiveView, string> = {
    scanner: "Escáner de imágenes",
    profile: "Mi perfil",
  };

  const viewSubtitles: Record<ActiveView, string | null> = {
    scanner: null,
    profile: "Resumen de tu cuenta y actividad",
  };

  const sidebarStyle = {
    background: "var(--layout-sidebar-bg)",
    backdropFilter: "blur(18px)",
    borderRight: "1px solid var(--layout-sidebar-border)",
    boxShadow: "var(--layout-sidebar-shadow)",
  } as const;

  const renderSidebarContent = (onNav?: () => void) => (
    <div className="flex flex-col h-full">
      {/* Marca */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "var(--app-brand-gradient)", boxShadow: "0 8px 20px -8px rgba(5, 150, 105, 0.45)" }}
            >
              <PawPrint size={22} color="white" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[15px] leading-tight truncate" style={{ fontWeight: 700, color: "var(--layout-heading)" }}>
                Clasificador
              </h1>
              <p className="text-[11px] truncate" style={{ color: "var(--layout-subheading)" }}>
                Animales online
              </p>
            </div>
          </div>
          {onNav && (
            <button
              type="button"
              onClick={onNav}
              className="p-2 rounded-lg shrink-0 transition-colors"
              style={{ color: "var(--layout-subheading)" }}
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="px-4 pb-2">
        <p
          className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--layout-label)" }}
        >
          Aplicación
        </p>
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView(item.id);
                    onNav?.();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 text-left"
                  style={{
                    background: active ? "var(--layout-nav-active-bg)" : "transparent",
                    border: active ? "1px solid var(--layout-nav-active-border)" : "1px solid transparent",
                    boxShadow: active ? "0 1px 2px rgba(15, 23, 42, 0.04)" : "none",
                    borderLeft: active ? "3px solid var(--app-accent)" : "3px solid transparent",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: active ? "var(--app-brand-gradient)" : "var(--layout-profile-bg)",
                      color: active ? "white" : "var(--layout-nav-text)",
                    }}
                  >
                    <Icon size={18} strokeWidth={active ? 2.25 : 2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm leading-tight"
                      style={{
                        fontWeight: active ? 600 : 500,
                        color: active ? "var(--layout-nav-text-active)" : "var(--layout-nav-text)",
                      }}
                    >
                      {item.label}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: "var(--layout-subheading)" }}>
                      {item.desc}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex-1 min-h-4" />

      {/* Pie del sidebar */}
      <div className="px-4 pb-5 space-y-3" style={{ borderTop: "1px solid var(--layout-divider)", paddingTop: "1rem" }}>
        <button
          type="button"
          onClick={() => {
            setActiveView("profile");
            onNav?.();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors"
          style={{
            background: activeView === "profile" ? "var(--layout-profile-bg)" : "var(--layout-profile-bg)",
            border: "1px solid var(--layout-divider)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: "var(--layout-profile-avatar-bg)" }}
          >
            {user?.avatar || "👤"}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm truncate" style={{ fontWeight: 600, color: "var(--layout-heading)" }}>
              {user?.username}
            </p>
            <p className="text-[11px] truncate" style={{ color: "var(--layout-subheading)" }}>
              {user?.email}
            </p>
          </div>
        </button>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium"
          style={{
            background: dbOnline === false ? "rgba(239, 68, 68, 0.06)" : "var(--layout-db-pill-bg)",
            color: dbOnline === false ? "#DC2626" : "var(--layout-db-pill-text)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background: dbOnline === null ? "#94A3B8" : dbOnline ? "var(--layout-db-pill-text)" : "#EF4444",
            }}
          />
          <Database size={11} className="shrink-0" />
          <span className="truncate">
            {dbOnline === null ? "Comprobando…" : dbOnline ? "Firestore activo" : "Sin conexión"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSkyDark((v) => !v)}
            className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs transition-colors"
            style={{
              background: "var(--app-surface)",
              border: "1px solid var(--app-surface-border)",
              color: "var(--app-text)",
              fontWeight: 600,
            }}
            aria-label={skyDark ? "Modo claro" : "Modo oscuro"}
          >
            {skyDark ? <Sun size={14} /> : <Moon size={14} />}
            <span>{skyDark ? "Claro" : "Oscuro"}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs transition-colors"
            style={{
              color: "var(--layout-logout-text)",
              border: "1px solid rgba(185, 28, 28, 0.15)",
              background: "var(--layout-logout-hover-bg)",
              fontWeight: 600,
            }}
          >
            <LogOut size={14} />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden flex-col" style={{ background: "var(--app-bg-gradient)" }}>
      <div className="flex flex-1 overflow-hidden min-h-0">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 lg:hidden"
            style={{ background: "var(--layout-overlay)" }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        <motion.aside
          className="fixed lg:hidden z-30 flex-shrink-0 w-[17.5rem] h-full flex flex-col"
          initial={{ x: -300 }}
          animate={{ x: sidebarOpen ? 0 : -300 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={sidebarStyle}
        >
          {renderSidebarContent(() => setSidebarOpen(false))}
        </motion.aside>

        <aside className="hidden lg:flex flex-shrink-0 w-[17.5rem] h-full flex-col" style={sidebarStyle}>
          {renderSidebarContent()}
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header
            className="flex items-center justify-between px-4 lg:px-8 py-3.5 flex-shrink-0"
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
                <p className="text-[11px] hidden sm:block uppercase tracking-wider" style={{ color: "var(--layout-label)", fontWeight: 600 }}>
                  Clasificador de animales
                </p>
                <h2 className="font-display truncate text-base sm:text-lg" style={{ fontWeight: 700, color: "var(--layout-heading)" }}>
                  {viewTitles[activeView]}
                </h2>
                {viewSubtitles[activeView] && (
                  <p className="text-xs truncate hidden md:block" style={{ color: "var(--layout-subheading)" }}>
                    {viewSubtitles[activeView]}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveView("profile")}
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: "var(--layout-profile-avatar-bg)", border: "1px solid var(--layout-divider)" }}
              aria-label="Perfil"
            >
              {user?.avatar || "👤"}
            </button>
          </header>

          <main className="flex-1 overflow-y-auto min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                {activeView === "scanner" && (
                  <AnimalScanner onScanComplete={() => setScanRefresh((n) => n + 1)} />
                )}
                {activeView === "profile" && <ProfilePage />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
