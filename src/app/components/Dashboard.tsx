import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity, Clock, Cpu, MemoryStick, Trash2, TrendingUp, CheckCircle2,
  AlertTriangle, XCircle, Database, Wifi, BarChart2, RefreshCw
} from "lucide-react";
import { ScanLog } from "../types";
import { getLogs, clearLogs, getStatsFromLogs } from "../store/metricsStore";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

function formatMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

//#hola mundo

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function StatusBadge({ status }: { status: ScanLog["status"] }) {
  const map = {
    success: { bg: "#ECFDF5", color: "#059669", label: "✓ OK", border: "#A7F3D0" },
    timeout: { bg: "#FFFBEB", color: "#D97706", label: "⏱ Timeout", border: "#FDE68A" },
    error: { bg: "#FEF2F2", color: "#DC2626", label: "✗ Error", border: "#FECACA" },
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
      style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 2px 16px rgba(99,102,241,0.07)" }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-gray-800" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </motion.div>
  );
}

interface DashboardProps {
  onClose: () => void;
  refreshTrigger?: number;
}

export function Dashboard({ onClose, refreshTrigger }: DashboardProps) {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getStatsFromLogs> | null>(null);
  const [filter, setFilter] = useState<"all" | "success" | "timeout" | "error">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoadError(null);
      const nextLogs = await getLogs();
      setLogs(nextLogs);
      setStats(getStatsFromLogs(nextLogs));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al leer Firestore";
      console.error("[Firestore] getLogs failed", e);
      setLoadError(msg);
    }
  };

  useEffect(() => {
    void refresh();
  }, [refreshTrigger]);

  const filtered = logs.filter((l) => filter === "all" || l.status === filter);

  const handleClear = () => {
    void clearLogs().then(() => refresh());
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
      style={{ background: "linear-gradient(160deg, #F8F9FF 0%, #F0FDF4 100%)", minHeight: "100vh" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid #E5E7EB", background: "rgba(255,255,255,0.95)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            <Database size={18} color="white" />
          </div>
          <div>
            <h2 className="text-gray-800" style={{ fontWeight: 700 }}>Panel de Métricas</h2>
            <p className="text-xs text-gray-400">{logs.length} registros en Firestore</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
          >
            ✕
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          No se pudieron cargar los registros: {loadError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Stats Grid */}
        {stats ? (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Activity size={20} />} label="Total llamados" value={String(stats.total)} color="#6366F1" />
            <StatCard icon={<CheckCircle2 size={20} />} label="Exitosos" value={String(stats.success)} sub={`${((stats.success / stats.total) * 100).toFixed(0)}% tasa`} color="#10B981" />
            <StatCard icon={<Clock size={20} />} label="Tiempo respuesta prom." value={formatMs(stats.avgResponseMs)} sub="máx. 10s" color="#F59E0B" />
            <StatCard icon={<Wifi size={20} />} label="Tiempo comunicación" value={formatMs(stats.avgCommMs)} color="#06B6D4" />
            <StatCard icon={<Cpu size={20} />} label="CPU promedio" value={`${stats.avgCpu}%`} color="#8B5CF6" />
            <StatCard icon={<MemoryStick size={20} />} label="RAM promedio" value={`${stats.avgMemMB} MB`} color="#F97316" />
            <StatCard icon={<AlertTriangle size={20} />} label="Timeouts" value={String(stats.timeouts)} color="#EF4444" />
            <StatCard icon={<TrendingUp size={20} />} label="Certeza promedio" value={`${stats.avgConfidence}%`} color="#059669" />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>Sin registros aún</p>
            <p className="text-xs mt-1">Realiza un escaneo para ver métricas</p>
          </div>
        )}

        {/* Filter tabs */}
        {logs.length > 0 && (
          <>
            <div className="flex gap-2 flex-wrap">
              {(["all", "success", "timeout", "error"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-xl text-xs transition-all duration-200"
                  style={{
                    background: filter === f ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "#F3F4F6",
                    color: filter === f ? "white" : "#6B7280",
                    fontWeight: filter === f ? 600 : 400,
                  }}
                >
                  {f === "all" ? `Todos (${logs.length})` : f === "success" ? `✓ Éxitos (${logs.filter(l => l.status === "success").length})` : f === "timeout" ? `⏱ Timeouts (${logs.filter(l => l.status === "timeout").length})` : `✗ Errores (${logs.filter(l => l.status === "error").length})`}
                </button>
              ))}
            </div>

            {/* Logs list */}
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No hay registros en esta categoría</div>
              ) : (
                filtered.map((log) => (
                  <motion.div
                    key={log.id}
                    layout
                    className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 1px 8px rgba(99,102,241,0.06)", border: "1px solid #F0F0F8" }}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <div className="px-4 py-3 flex items-center gap-3">
                      <span className="text-2xl flex-shrink-0">{log.animalEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{log.animalDetected}</span>
                          <StatusBadge status={log.status} />
                        </div>
                        <p className="text-xs text-gray-400 truncate">{log.fileName} · {formatBytes(log.fileSize)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs" style={{ color: log.responseTimeMs > 8000 ? "#EF4444" : "#10B981", fontWeight: 600 }}>
                          {formatMs(log.responseTimeMs)}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedId === log.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div
                            className="px-4 pb-4 pt-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs"
                            style={{ borderTop: "1px solid #F0F0F8" }}
                          >
                            <div><span className="text-gray-400">Usuario:</span> <span className="text-gray-700 font-medium">{log.username}</span></div>
                            <div><span className="text-gray-400">Certeza:</span> <span className="text-gray-700 font-medium">{log.confidence.toFixed(1)}%</span></div>
                            <div><span className="text-gray-400">Tipo archivo:</span> <span className="text-gray-700 font-medium">{log.fileType}</span></div>
                            <div><span className="text-gray-400">Tamaño:</span> <span className="text-gray-700 font-medium">{formatBytes(log.fileSize)}</span></div>
                            <div><span className="text-gray-400">T. Comunicación:</span> <span className="text-gray-700 font-medium">{formatMs(log.communicationTimeMs)}</span></div>
                            <div><span className="text-gray-400">T. Respuesta:</span> <span className="text-gray-700 font-medium">{formatMs(log.responseTimeMs)}</span></div>
                            <div><span className="text-gray-400">T. Total:</span> <span className="text-gray-700 font-medium">{formatMs(log.totalTimeMs)}</span></div>
                            <div><span className="text-gray-400">Timeout:</span> <span className={log.timedOut ? "text-red-500 font-medium" : "text-green-600 font-medium"}>{log.timedOut ? "Sí" : "No"}</span></div>
                            <div><span className="text-gray-400">CPU:</span> <span className="text-gray-700 font-medium">{log.cpuUsage.toFixed(1)}%</span></div>
                            <div><span className="text-gray-400">RAM:</span> <span className="text-gray-700 font-medium">{log.memoryUsageMB.toFixed(1)} MB</span></div>
                            <div><span className="text-gray-400">Red:</span> <span className="text-gray-700 font-medium">{log.networkSpeedKBps.toFixed(0)} KB/s</span></div>
                            <div className="col-span-2"><span className="text-gray-400">Fecha:</span> <span className="text-gray-700 font-medium">{new Date(log.timestamp).toLocaleString("es")}</span></div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </div>

            {/* Clear logs */}
            <div className="pb-4">
              <Button
                onClick={handleClear}
                variant="outline"
                className="w-full rounded-2xl text-sm"
                style={{ color: "#EF4444", borderColor: "#FECACA" }}
              >
                <Trash2 size={14} className="mr-2" />
                Limpiar todos los registros
              </Button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
