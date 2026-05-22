import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { MainLayout } from "./components/MainLayout";

function AppContent() {
  const { user, loading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(true);
  }, []);

  if (!checked || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--app-bg-gradient)" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-11 h-11 rounded-full"
          style={{ border: "3px solid var(--app-accent-soft)", borderTopColor: "var(--app-accent)" }}
        />
        <p className="text-sm font-display" style={{ color: "var(--app-text-muted)", fontWeight: 600 }}>
          Cargando…
        </p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors closeButton duration={3500} />
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <LoginPage onSuccess={() => {}} />
          </motion.div>
        ) : (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-screen">
            <MainLayout onLogout={() => {}} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
