import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ScanLine, LogOut, Menu, X, Database } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AnimalScanner } from "./AnimalScanner";

type ActiveView = "scanner";

interface MainLayoutProps {
  onLogout: () => void;
}

export function MainLayout({ onLogout }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>("scanner");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const navItems = [
    { id: "scanner" as const, label: "Escáner", icon: <ScanLine size={20} />, emoji: "🔬" },
  ];

  const sidebarChrome = {
    surface: {
      background: "var(--layout-sidebar-bg)",
      backdropFilter: "blur(18px)",
      borderRight: "1px solid var(--layout-sidebar-border)",
      boxShadow: "var(--layout-sidebar-shadow)",
    } as const,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--app-bg-gradient)" }}>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: "var(--layout-overlay)" }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile sidebar drawer */}
      <motion.aside
        className="fixed lg:hidden z-30 flex-shrink-0 w-64 h-full flex flex-col"
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={sidebarChrome.surface}
      >
        <div className="px-5 py-6" style={{ borderBottom: "1px solid var(--layout-divider)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "var(--app-brand-gradient)" }}>
                <span className="text-xl">🔬</span>
              </div>
              <div>
                <h1 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--layout-heading)" }}>Animal Scanner</h1>
                <p className="text-xs" style={{ color: "var(--layout-subheading)" }}>v2.0 Pro</p>
              </div>
            </div>
            <button type="button" onClick={() => setSidebarOpen(false)} style={{ color: "var(--layout-subheading)" }} className="p-1 rounded-lg hover:opacity-80">
              <X size={20} />
            </button>
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
            <span className="px-2 py-0.5 rounded-full text-xs" style={{
              background: user?.role === "admin" ? "rgba(99, 102, 241, 0.15)" : "rgba(16, 185, 129, 0.14)",
              color: user?.role === "admin" ? "var(--layout-nav-text-active)" : "var(--layout-db-pill-text)",
              fontWeight: 600,
            }}>
              {user?.role}
            </span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          <p className="text-xs px-3 mb-2 uppercase tracking-wider" style={{ color: "var(--layout-label)", letterSpacing: "0.06em" }}>Módulos</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveView(item.id); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 text-left"
              style={{
                background: activeView === item.id ? "var(--layout-nav-active-bg)" : "transparent",
                color: activeView === item.id ? "var(--layout-nav-text-active)" : "var(--layout-nav-text)",
                fontWeight: activeView === item.id ? 600 : 500,
                border: activeView === item.id ? "1px solid var(--layout-nav-active-border)" : "1px solid transparent",
              }}
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-5 py-3" style={{ borderTop: "1px solid var(--layout-divider)" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "var(--layout-db-pill-bg)", color: "var(--layout-db-pill-text)" }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--layout-db-pill-text)" }} />
            <Database size={12} />
            <span>Base de datos · Firebase (Firestore)</span>
          </div>
        </div>
        <div className="px-5 pb-3">
          <button
            type="button"
            onClick={() => setSkyDark((v) => !v)}
            className="w-full px-3 py-2 rounded-xl text-xs text-left transition-colors"
            style={{
              background: "var(--app-surface)",
              border: "1px solid var(--app-surface-border)",
              color: "var(--app-text)",
              fontWeight: 700,
            }}
          >
            {skyDark ? "☀️ Modo claro" : "🌙 Modo oscuro"}
          </button>
        </div>
        <div className="px-4 pb-5">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-left"
            style={{ color: "var(--layout-logout-text)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--layout-logout-hover-bg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={18} />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        </div>
      </motion.aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-shrink-0 w-64 h-full flex-col" style={sidebarChrome.surface}>
        <div className="px-5 py-6" style={{ borderBottom: "1px solid var(--layout-divider)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "var(--app-brand-gradient)" }}>
              <span className="text-xl">🔬</span>
            </div>
            <div>
              <h1 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--layout-heading)" }}>Animal Scanner</h1>
              <p className="text-xs" style={{ color: "var(--layout-subheading)" }}>v2.0 Pro</p>
            </div>
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
            <span className="px-2 py-0.5 rounded-full text-xs" style={{
              background: user?.role === "admin" ? "rgba(99, 102, 241, 0.15)" : "rgba(16, 185, 129, 0.14)",
              color: user?.role === "admin" ? "var(--layout-nav-text-active)" : "var(--layout-db-pill-text)",
              fontWeight: 600,
            }}>
              {user?.role}
            </span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          <p className="text-xs px-3 mb-2 uppercase tracking-wider" style={{ color: "var(--layout-label)", letterSpacing: "0.06em" }}>Módulos</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 text-left"
              style={{
                background: activeView === item.id ? "var(--layout-nav-active-bg)" : "transparent",
                color: activeView === item.id ? "var(--layout-nav-text-active)" : "var(--layout-nav-text)",
                fontWeight: activeView === item.id ? 600 : 500,
                border: activeView === item.id ? "1px solid var(--layout-nav-active-border)" : "1px solid transparent",
              }}
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-5 py-3" style={{ borderTop: "1px solid var(--layout-divider)" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "var(--layout-db-pill-bg)", color: "var(--layout-db-pill-text)" }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--layout-db-pill-text)" }} />
            <Database size={12} />
            <span>Base de datos · Firebase (Firestore)</span>
          </div>
        </div>
        <div className="px-5 pb-3">
          <button
            type="button"
            onClick={() => setSkyDark((v) => !v)}
            className="w-full px-3 py-2 rounded-xl text-xs text-left transition-colors"
            style={{
              background: "var(--app-surface)",
              border: "1px solid var(--app-surface-border)",
              color: "var(--app-text)",
              fontWeight: 700,
            }}
          >
            {skyDark ? "☀️ Modo claro" : "🌙 Modo oscuro"}
          </button>
        </div>
        <div className="px-4 pb-5">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors text-left"
            style={{ color: "var(--layout-logout-text)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--layout-logout-hover-bg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={18} />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile topbar */}
        <div
          className="lg:hidden flex items-center justify-between px-4 py-3 flex-shrink-0 backdrop-blur-md"
          style={{
            background: "var(--layout-topbar-bg)",
            borderBottom: "1px solid var(--layout-topbar-border)",
          }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: "var(--layout-nav-text)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--layout-nav-active-bg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">🔬</span>
            <span className="truncate" style={{ fontWeight: 700, color: "var(--layout-heading)" }}>Animal Scanner</span>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: "var(--layout-profile-avatar-bg)" }}>
            {user?.avatar || "👤"}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key="scanner"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <AnimalScanner />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
