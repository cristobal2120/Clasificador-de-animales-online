import { useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, LogIn, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { login, register } from "../store/authStore";

const AVATARS = ["🦁", "🐬", "🐼", "🦊", "🐯", "🐘", "🦜", "🐕", "🐈", "🐢"];

interface LoginPageProps {
  onSuccess: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const { setUser } = useAuth();
  const [skyDark, setSkyDark] = useState(() => {
    try {
      return localStorage.getItem("animalscan_theme") === "sky";
    } catch {
      return false;
    }
  });
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let result;
    if (mode === "login") {
      result = await login(email || username, password);
    } else {
      if (!username.trim() || !email.trim() || !password.trim()) {
        setError("Completa todos los campos");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        setLoading(false);
        return;
      }
      result = await register(username, email, password, selectedAvatar);
    }

    if (result.success && result.user) {
      setUser(result.user);
      onSuccess();
    } else {
      setError(result.error || "Error desconocido");
    }
    setLoading(false);
  };

  const inputClass =
    "w-full px-4 py-3 rounded-2xl outline-none transition-all duration-200 placeholder:opacity-50";
  const inputStyle: CSSProperties = {
    background: "var(--input-background)",
    border: "1px solid var(--app-surface-border)",
    color: "var(--app-text)",
  };

  const toggleTheme = () => {
    setSkyDark((v) => {
      const next = !v;
      const root = document.documentElement;
      if (next) root.classList.add("dark");
      else root.classList.remove("dark");
      try {
        localStorage.setItem("animalscan_theme", next ? "sky" : "light");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--app-bg-gradient)" }}
    >
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="px-3 py-2 rounded-xl text-xs transition-colors"
          style={{
            background: "var(--app-surface)",
            border: `1px solid var(--app-surface-border)`,
            color: "var(--app-text)",
            fontWeight: 700,
          }}
        >
          {skyDark ? "☀️ Modo claro" : "🌙 Modo oscuro"}
        </button>
      </div>
      {/* Ambient glow (theme tokens) */}
      <div
        className="fixed top-20 left-10 w-64 h-64 rounded-full opacity-[0.14] blur-3xl pointer-events-none"
        style={{ background: "var(--app-decorative-glow-a)" }}
      />
      <div
        className="fixed bottom-20 right-10 w-80 h-80 rounded-full opacity-[0.14] blur-3xl pointer-events-none"
        style={{ background: "var(--app-decorative-glow-b)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-3 mb-3"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "var(--app-brand-gradient)",
                boxShadow: "0 10px 28px -10px rgba(15, 23, 42, 0.2)",
              }}
            >
              <span className="text-3xl">🔬</span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--app-text)" }}>
              Animal Scanner
            </h1>
          </motion.div>
          <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>Identificación de animales a partir de fotos</p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: "var(--app-card-bg)",
            backdropFilter: "blur(18px)",
            border: "1px solid var(--app-card-border)",
            boxShadow: "var(--app-card-shadow)",
          }}
        >
          {/* Mode Toggle */}
          <div
            className="flex rounded-2xl p-1 mb-6"
            style={{ background: "var(--layout-profile-bg)" }}
          >
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className="flex-1 py-2 rounded-xl text-sm transition-all duration-200"
                style={{
                  background: mode === m ? "var(--app-surface-strong)" : "transparent",
                  color: mode === m ? "var(--layout-nav-text-active)" : "var(--app-text-muted)",
                  fontWeight: mode === m ? 600 : 500,
                  boxShadow: mode === m ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
                  border: mode === m ? "1px solid var(--app-surface-border)" : "1px solid transparent",
                }}
              >
                {m === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {mode === "register" && (
                <motion.div
                  key="reg-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Avatar selector */}
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: "var(--app-text-muted)" }}>Elige tu avatar</label>
                    <div className="flex flex-wrap gap-2">
                      {AVATARS.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setSelectedAvatar(av)}
                          className="w-10 h-10 rounded-xl text-xl transition-all duration-150 flex items-center justify-center"
                          style={{
                            background: selectedAvatar === av ? "var(--layout-nav-active-bg)" : "var(--app-tag-bg)",
                            border: selectedAvatar === av ? "2px solid var(--layout-nav-active-border)" : "2px solid transparent",
                            transform: selectedAvatar === av ? "scale(1.15)" : "scale(1)",
                          }}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="text-sm mb-1 block" style={{ color: "var(--app-text-muted)" }}>Usuario</label>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="tu_usuario"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="text-sm mb-1 block" style={{ color: "var(--app-text-muted)" }}>
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === "login" ? "admin@animalscan.ai" : "tu@email.com"}
                type="email"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm mb-1 block" style={{ color: "var(--app-text-muted)" }}>Contraseña</label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={inputClass}
                  style={{ ...inputStyle, paddingRight: "48px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--app-text-muted)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--app-text)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--app-text-muted)"; }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"
                  style={{
                    background: "color-mix(in srgb, var(--destructive) 10%, var(--card))",
                    color: "var(--destructive)",
                    border: "1px solid color-mix(in srgb, var(--destructive) 22%, transparent)",
                  }}
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl"
              style={{
                background: loading ? "var(--layout-muted-track)" : "var(--app-brand-gradient)",
                color: loading ? "var(--app-text-muted)" : "white",
                border: loading ? "1px solid var(--app-surface-border)" : "none",
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 rounded-full"
                    style={{
                      borderWidth: 2,
                      borderStyle: "solid",
                      borderColor: "var(--app-text-muted)",
                      borderTopColor: "transparent",
                    }}
                  />
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </span>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
