import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity, Clock, Cpu, MemoryStick, Trash2, TrendingUp, CheckCircle2,
  AlertTriangle, Database, Wifi, BarChart2, RefreshCw, Download, ScanLine
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ScanLog } from "../types";
import { getLogs, clearLogs, getStatsFromLogs } from "../store/metricsStore";
import { Button } from "./ui/button";

function formatMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function StatusBadge({ status }: { status: ScanLog["status"] }) {
  const map = {
    success: { bg: "var(--app-accent-soft)", color: "#059669", label: "OK", border: "rgba(5,150,105,0.25)" },
    timeout: { bg: "#FFFBEB", color: "#D97706", label: "Timeout", border: "#FDE68A" },
    error: { bg: "#FEF2F2", color: "#DC2626", label: "Error", border: "#FECACA" },
  };
  const s = map[status];
  return (
    <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{ background: "var(--app-card-bg)", boxShadow: "var(--app-card-shadow)", border: "1px solid var(--app-card-border)" }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs mb-0.5" style={{ color: "var(--app-text-muted)" }}>{label}</p>
        <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--app-text)" }}>{value}</p>
        {sub && <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl h-24" style={{ background: "var(--layout-muted-track)" }} />
      ))}
    </div>
  );
}

function exportLogsCsv(logs: ScanLog[]) {
  const headers = ["timestamp", "username", "animal", "status", "confidence", "responseMs"];
  const rows = logs.map((l) =>
    [l.timestamp, l.username, l.animalDetected, l.status, l.confidence, l.responseTimeMs].join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `escaneos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface DashboardProps {
  onClose?: () => void;
  refreshTrigger?: number;
  embedded?: boolean;
}

export function Dashboard({ onClose, refreshTrigger, embedded }: DashboardProps) {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getStatsFromLogs> | null>(null);
  const [filter, setFilter] = useState<"all" | "success" | "timeout" | "error">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setLoadError(null);
      const nextLogs = await getLogs();
      setLogs(nextLogs);
      setStats(getStatsFromLogs(nextLogs));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al leer Firestore";
      console.error("[Firestore] getLogs failed", e);
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [refreshTrigger]);

  const filtered = logs.filter((l) => filter === "all" || l.status === filter);

  const chartData = stats
    ? [
        { name: "Éxitos", value: stats.success, fill: "#059669" },
        { name: "Timeouts", value: stats.timeouts, fill: "#D97706" },
        { name: "Errores", value: stats.errors, fill: "#DC2626" },
      ]
    : [];

  const handleClear = () => {
    void clearLogs().then(() => refresh());
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: "var(--app-bg-gradient)" }}>
      <div
        className="flex items-center justify-between px-6 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--layout-divider)", background: "var(--app-surface-strong)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--app-brand-gradient)" }}>
            <Database size={18} color="white" />
          </div>
          <div>
            <h2 className="font-display" style={{ fontWeight: 700, color: "var(--app-text)" }}>Panel de métricas</h2>
            <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>{logs.length} registros en Firestore</p>
          </div>
        </div>
        <div className="flex gap-2">
          {logs.length > 0 && (
            <button
              type="button"
              onClick={() => exportLogsCsv(logs)}
              className="p-2 rounded-xl transition-colors"
              title="Exportar CSV"
              style={{ color: "var(--app-text-muted)" }}
            >
              <Download size={16} />
            </button>
          )}
          <button type="button" onClick={refresh} className="p-2 rounded-xl" title="Actualizar" style={{ color: "var(--app-text-muted)" }}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          {!embedded && onClose && (
            <button type="button" onClick={onClose} className="p-2 rounded-xl" style={{ color: "var(--app-text-muted)" }} aria-label="Cerrar">
              ✕
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          No se pudieron cargar los registros: {loadError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {loading ? (
          <SkeletonGrid />
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Activity size={20} />} label="Total llamados" value={String(stats.total)} color="#4F46E5" />
              <StatCard icon={<CheckCircle2 size={20} />} label="Exitosos" value={String(stats.success)} sub={`${((stats.success / stats.total) * 100).toFixed(0)}% tasa`} color="#059669" />
              <StatCard icon={<Clock size={20} />} label="Tiempo respuesta" value={formatMs(stats.avgResponseMs)} sub="máx. 10s" color="#F59E0B" />
              <StatCard icon={<Wifi size={20} />} label="Comunicación" value={formatMs(stats.avgCommMs)} color="#06B6D4" />
              <StatCard icon={<Cpu size={20} />} label="CPU promedio" value={`${stats.avgCpu}%`} color="#8B5CF6" />
              <StatCard icon={<MemoryStick size={20} />} label="RAM promedio" value={`${stats.avgMemMB} MB`} color="#F97316" />
              <StatCard icon={<AlertTriangle size={20} />} label="Timeouts" value={String(stats.timeouts)} color="#EF4444" />
              <StatCard icon={<TrendingUp size={20} />} label="Certeza media" value={`${stats.avgConfidence}%`} color="#059669" />
            </div>

            <div
              className="rounded-3xl p-5"
              style={{ background: "var(--app-card-bg)", border: "1px solid var(--app-card-border)", boxShadow: "var(--app-card-shadow)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={18} style={{ color: "var(--layout-nav-text-active)" }} />
                <h3 className="text-sm font-display" style={{ fontWeight: 600, color: "var(--app-text)" }}>Resultados por estado</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: "var(--app-text-muted)", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--app-text-muted)", fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--app-card-border)" }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div
            className="text-center py-14 rounded-3xl"
            style={{ background: "var(--app-card-bg)", border: "1px solid var(--app-card-border)", boxShadow: "var(--app-card-shadow)" }}
          >
            <ScanLine size={48} className="mx-auto mb-4 opacity-40" style={{ color: "var(--layout-nav-text-active)" }} />
            <p className="font-display" style={{ fontWeight: 600, color: "var(--app-text)" }}>Aún no hay escaneos</p>
            <p className="text-sm mt-2" style={{ color: "var(--app-text-muted)" }}>Realiza un escaneo en el módulo Escáner para ver métricas aquí</p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <>
            <div className="flex gap-2 flex-wrap">
              {(["all", "success", "timeout", "error"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-xl text-xs transition-all duration-200"
                  style={{
                    background: filter === f ? "var(--app-brand-gradient)" : "var(--app-chip-bg)",
                    color: filter === f ? "white" : "var(--app-chip-text)",
                    fontWeight: filter === f ? 600 : 400,
                    border: filter === f ? "none" : "1px solid var(--app-chip-border)",
                  }}
                >
                  {f === "all" ? `Todos (${logs.length})` : f === "success" ? `Éxitos (${logs.filter((l) => l.status === "success").length})` : f === "timeout" ? `Timeouts (${logs.filter((l) => l.status === "timeout").length})` : `Errores (${logs.filter((l) => l.status === "error").length})`}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filtered.map((log, idx) => (
                <motion.div
                  key={log.id + idx}
                  layout
                  className="rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    background: idx % 2 === 0 ? "var(--app-card-bg)" : "var(--app-surface)",
                    boxShadow: "var(--app-card-shadow)",
                    border: "1px solid var(--app-card-border)",
                  }}
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <div className="px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{log.animalEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm" style={{ fontWeight: 600, color: "var(--app-text)" }}>{log.animalDetected}</span>
                        <StatusBadge status={log.status} />
                      </div>
                      <p className="text-xs truncate" style={{ color: "var(--app-text-muted)" }}>{log.fileName} · {formatBytes(log.fileSize)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs" style={{ color: log.responseTimeMs > 8000 ? "#EF4444" : "#059669", fontWeight: 600 }}>
                        {formatMs(log.responseTimeMs)}
                      </p>
                      <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
                        {new Date(log.timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === log.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs" style={{ borderTop: "1px solid var(--layout-divider)" }}>
                          <div><span style={{ color: "var(--app-text-muted)" }}>Usuario:</span> <span style={{ color: "var(--app-text)", fontWeight: 500 }}>{log.username}</span></div>
                          <div><span style={{ color: "var(--app-text-muted)" }}>Certeza:</span> <span style={{ color: "var(--app-text)", fontWeight: 500 }}>{log.confidence.toFixed(1)}%</span></div>
                          <div className="col-span-2"><span style={{ color: "var(--app-text-muted)" }}>Fecha:</span> <span style={{ color: "var(--app-text)", fontWeight: 500 }}>{new Date(log.timestamp).toLocaleString("es")}</span></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            <Button onClick={handleClear} variant="outline" className="w-full rounded-2xl text-sm" style={{ color: "#EF4444", borderColor: "#FECACA" }}>
              <Trash2 size={14} className="mr-2" />
              Limpiar todos los registros
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
