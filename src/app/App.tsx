import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--app-bg-gradient)" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full"
        />
      </div>
    );
  }

  return (
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
