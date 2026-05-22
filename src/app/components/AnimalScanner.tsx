import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, RefreshCw, CheckCircle2, Cpu, Clock, Wifi, MemoryStick, ChevronDown, Activity, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { useAuth } from "../context/AuthContext";
import { addLog } from "../store/metricsStore";
import { ScanLog } from "../types";
import { getConfidenceColor, getConfidenceLabel, validateImageFile, MAX_IMAGE_BYTES } from "../lib/uiHelpers";

const SPECIES_TAGS = ["🐕 Perro", "🐈 Gato", "🦁 León", "🐘 Elefante", "🦜 Pájaro", "🐬 Delfín", "🐼 Panda", "🦊 Zorro"];

const ANIMAL_DATABASE = [
  { name: "Perro", emoji: "🐕", confidence: 94.7, color: "#F59E0B", category: "Mamífero doméstico", description: "Canis lupus familiaris" },
  { name: "Gato", emoji: "🐈", confidence: 91.3, color: "#8B5CF6", category: "Mamífero doméstico", description: "Felis catus" },
  { name: "Pájaro", emoji: "🦜", confidence: 87.6, color: "#10B981", category: "Ave", description: "Clase Aves" },
  { name: "Conejo", emoji: "🐇", confidence: 85.2, color: "#F97316", category: "Mamífero doméstico", description: "Oryctolagus cuniculus" },
  { name: "Pez", emoji: "🐠", confidence: 82.9, color: "#06B6D4", category: "Pez", description: "Superclase Pisces" },
  { name: "León", emoji: "🦁", confidence: 96.1, color: "#EAB308", category: "Mamífero salvaje", description: "Panthera leo" },
  { name: "Elefante", emoji: "🐘", confidence: 97.4, color: "#6B7280", category: "Mamífero salvaje", description: "Loxodonta africana" },
  { name: "Tigre", emoji: "🐯", confidence: 93.8, color: "#EF4444", category: "Mamífero salvaje", description: "Panthera tigris" },
  { name: "Delfín", emoji: "🐬", confidence: 88.5, color: "#3B82F6", category: "Mamífero marino", description: "Delphinidae" },
  { name: "Oso Panda", emoji: "🐼", confidence: 95.0, color: "#374151", category: "Mamífero salvaje", description: "Ailuropoda melanoleuca" },
  { name: "Pingüino", emoji: "🐧", confidence: 89.3, color: "#1D4ED8", category: "Ave", description: "Spheniscidae" },
  { name: "Tortuga", emoji: "🐢", confidence: 83.7, color: "#16A34A", category: "Reptil", description: "Testudinata" },
  { name: "Caballo", emoji: "🐴", confidence: 92.2, color: "#78350F", category: "Mamífero doméstico", description: "Equus ferus caballus" },
  { name: "Zorro", emoji: "🦊", confidence: 86.4, color: "#C2410C", category: "Mamífero salvaje", description: "Vulpes vulpes" },
  { name: "Lobo", emoji: "🐺", confidence: 90.1, color: "#475569", category: "Mamífero salvaje", description: "Canis lupus" },
];

const MAX_COMM_TIME_MS = 10000;

function simulatePrediction() {
  const mainIndex = Math.floor(Math.random() * ANIMAL_DATABASE.length);
  const main = ANIMAL_DATABASE[mainIndex];
  return { main };
}

type ScanPhase = "idle" | "uploading" | "scanning" | "result" | "timeout";

const PHASE_STEPS: { id: ScanPhase; label: string }[] = [
  { id: "uploading", label: "Subiendo" },
  { id: "scanning", label: "Analizando" },
  { id: "result", label: "Resultado" },
];

function ScanStepper({ phase }: { phase: ScanPhase }) {
  const order: ScanPhase[] = ["uploading", "scanning", "result"];
  const current = phase === "timeout" ? 2 : order.indexOf(phase);

  return (
    <div className="flex items-center justify-center gap-2 mb-6 px-2">
      {PHASE_STEPS.map((step, i) => {
        const done = current > i;
        const active = current === i;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{
                background: done || active ? "var(--app-brand-gradient)" : "var(--layout-muted-track)",
                color: done || active ? "white" : "var(--app-text-muted)",
              }}
            >
              {done ? "✓" : i + 1}
            </div>
            <span className="text-xs hidden sm:inline" style={{ fontWeight: active ? 600 : 500, color: active ? "var(--app-text)" : "var(--app-text-muted)" }}>
              {step.label}
            </span>
            {i < 2 && <div className="w-6 h-0.5 rounded" style={{ background: done ? "var(--app-accent)" : "var(--layout-muted-track)" }} />}
          </div>
        );
      })}
    </div>
  );
}

interface UploadMetrics {
  uploadProgress: number;
  uploadSpeedKBps: number;
  uploadedBytes: number;
  totalBytes: number;
  elapsedMs: number;
  cpuUsage: number;
  memoryMB: number;
}

interface ScannerProps {
  onScanComplete?: () => void;
}

export function AnimalScanner({ onScanComplete }: ScannerProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [prediction, setPrediction] = useState<ReturnType<typeof simulatePrediction> | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [metrics, setMetrics] = useState<UploadMetrics>({
    uploadProgress: 0, uploadSpeedKBps: 0, uploadedBytes: 0,
    totalBytes: 0, elapsedMs: 0, cpuUsage: 0, memoryMB: 0,
  });
  const [scanMetrics, setScanMetrics] = useState({ responseMs: 0, commMs: 0, timedOut: false });
  const [savedLog, setSavedLog] = useState<ScanLog | null>(null);
  const [firestoreDocId, setFirestoreDocId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showMetricsDetail, setShowMetricsDetail] = useState(false);
  const [showSpecies, setShowSpecies] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const uploadStartRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const simulateCpuMemory = () => ({
    cpuUsage: 15 + Math.random() * 45,
    memoryMB: 120 + Math.random() * 80,
  });

  const persistLog = useCallback(async (log: ScanLog) => {
    setSaveError(null);
    setFirestoreDocId(null);
    try {
      const docId = await addLog(log);
      setFirestoreDocId(docId);
      toast.success("Escaneo guardado en Firestore");
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo guardar en Firestore";
      console.error("[Firestore] persistLog failed", e);
      setSaveError(msg);
      toast.error("No se guardó en la base de datos");
      return false;
    }
  }, []);

  const processImage = useCallback((file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setCurrentFile(file);
    setPhase("uploading");
    setSavedLog(null);
    setFirestoreDocId(null);
    setSaveError(null);

    const totalBytes = file.size;
    let uploaded = 0;
    uploadStartRef.current = Date.now();
    startTimeRef.current = Date.now();

    // Set 10s timeout
    timeoutRef.current = setTimeout(() => {
      setPhase("timeout");
      const commTime = Date.now() - uploadStartRef.current;
      setScanMetrics({ responseMs: MAX_COMM_TIME_MS, commMs: commTime, timedOut: true });
      const res = simulatePrediction();
      const hw = simulateCpuMemory();
      const log: ScanLog = {
        id: Date.now().toString(),
        userId: user?.id || "guest",
        username: user?.username || "guest",
        timestamp: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        animalDetected: res.main.name,
        animalEmoji: res.main.emoji,
        confidence: res.main.confidence,
        uploadStartTime: uploadStartRef.current,
        uploadEndTime: Date.now(),
        scanStartTime: Date.now(),
        scanEndTime: Date.now(),
        communicationTimeMs: commTime,
        responseTimeMs: MAX_COMM_TIME_MS,
        totalTimeMs: Date.now() - startTimeRef.current,
        timedOut: true,
        cpuUsage: hw.cpuUsage,
        memoryUsageMB: hw.memoryMB,
        networkSpeedKBps: (file.size / 1024) / (commTime / 1000),
        status: "timeout",
      };
      setSavedLog(log);
      void persistLog(log).then((ok) => {
        if (ok && onScanComplete) onScanComplete();
      });
    }, MAX_COMM_TIME_MS);

    // Simulate real-time chunked upload
    const chunkInterval = 80;
    const chunkSize = Math.max(1024, totalBytes / 40);
    let lastUpdate = Date.now();

    const uploadInterval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastUpdate;
      lastUpdate = now;
      uploaded = Math.min(uploaded + chunkSize * (delta / chunkInterval) * (0.7 + Math.random() * 0.6), totalBytes);
      const elapsed = now - uploadStartRef.current;
      const speedKBps = uploaded / 1024 / (elapsed / 1000);
      const hw = simulateCpuMemory();

      setMetrics({
        uploadProgress: (uploaded / totalBytes) * 100,
        uploadSpeedKBps: speedKBps,
        uploadedBytes: uploaded,
        totalBytes,
        elapsedMs: elapsed,
        cpuUsage: hw.cpuUsage,
        memoryMB: hw.memoryMB,
      });

      if (uploaded >= totalBytes) {
        clearInterval(uploadInterval);
        const uploadEnd = Date.now();
        const commTime = uploadEnd - uploadStartRef.current;

        setTimeout(() => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setPhase("scanning");
          const scanStart = Date.now();

          setTimeout(() => {
            const scanEnd = Date.now();
            const responseMs = scanEnd - scanStart;
            const timedOut = false;
            setScanMetrics({ responseMs, commMs: commTime, timedOut });

            const result = simulatePrediction();
            setPrediction(result);
            setPhase("result");

            const hw2 = simulateCpuMemory();
            const log: ScanLog = {
              id: Date.now().toString(),
              userId: user?.id || "guest",
              username: user?.username || "guest",
              timestamp: new Date().toISOString(),
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              animalDetected: result.main.name,
              animalEmoji: result.main.emoji,
              confidence: result.main.confidence,
              uploadStartTime: uploadStartRef.current,
              uploadEndTime: uploadEnd,
              scanStartTime: scanStart,
              scanEndTime: scanEnd,
              communicationTimeMs: commTime,
              responseTimeMs: responseMs,
              totalTimeMs: scanEnd - startTimeRef.current,
              timedOut,
              cpuUsage: hw2.cpuUsage,
              memoryUsageMB: hw2.memoryMB,
              networkSpeedKBps: (file.size / 1024) / (commTime / 1000),
              status: "success",
            };
            setSavedLog(log);
            void persistLog(log).then((ok) => {
              if (ok && onScanComplete) onScanComplete();
            });
          }, 2000 + Math.random() * 500);
        }, 200);
      }
    }, chunkInterval);
  }, [user, onScanComplete, persistLog]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (phase !== "idle") return;
      const file = e.clipboardData?.files?.[0];
      if (file?.type.startsWith("image/")) {
        e.preventDefault();
        processImage(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [phase, processImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImage(file);
  };

  const handleReset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPhase("idle");
    setImageUrl(null);
    setCurrentFile(null);
    setPrediction(null);
    setSavedLog(null);
    setFirestoreDocId(null);
    setSaveError(null);
    setMetrics({ uploadProgress: 0, uploadSpeedKBps: 0, uploadedBytes: 0, totalBytes: 0, elapsedMs: 0, cpuUsage: 0, memoryMB: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b.toFixed(0)} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatMs = (ms: number) => ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;

  // Live metrics bar
  const LiveMetricBar = ({ label, value, max, color, unit }: { label: string; value: number; max: number; color: string; unit: string }) => (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>{label}</span>
        <span className="text-xs" style={{ color, fontWeight: 600 }}>{value.toFixed(1)}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--layout-muted-track)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );

  return (
    <div className="pb-10 max-w-2xl mx-auto px-4 sm:px-6 pt-4">
        {phase !== "idle" && <ScanStepper phase={phase} />}
        <AnimatePresence mode="wait">

          {/* IDLE */}
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
              <div
                role="button"
                tabIndex={0}
                aria-label="Zona para subir imagen de animal. Arrastra, haz clic o pega desde el portapapeles."
                className="rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 border-2 outline-none focus-visible:ring-2"
                style={{
                  background: dragOver ? "var(--app-upload-well-bg)" : "var(--app-card-bg)",
                  borderColor: dragOver ? "var(--app-accent)" : "var(--app-card-border)",
                  borderStyle: dragOver ? "solid" : "dashed",
                  backdropFilter: "blur(12px)",
                  boxShadow: dragOver ? "0 0 0 4px var(--app-accent-soft)" : "var(--app-card-shadow)",
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              >
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <motion.div
                  animate={{ y: dragOver ? -6 : [0, -8, 0] }}
                  transition={dragOver ? {} : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mb-6"
                >
                  <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg" style={{ background: "var(--app-upload-well-bg)" }}>
                    <Upload size={40} style={{ color: "var(--layout-nav-text-active)" }} />
                  </div>
                </motion.div>
                <h2 className="mb-2" style={{ fontSize: "1.3rem", fontWeight: 600, color: "var(--app-text)" }}>Sube tu imagen</h2>
                <p className="mb-2 text-sm" style={{ color: "var(--app-text-muted)" }}>
                  Arrastra, haz clic o pega con Ctrl+V
                </p>
                <p className="mb-6 text-xs" style={{ color: "var(--layout-label)" }}>
                  JPG, PNG, WEBP, GIF · máx. {MAX_IMAGE_BYTES / (1024 * 1024)} MB
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {["JPG", "PNG", "WEBP", "GIF"].map(f => (
                    <span key={f} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "var(--app-chip-bg)", color: "var(--app-chip-text)", border: "1px solid var(--app-chip-border)" }}>{f}</span>
                  ))}
                </div>
                <Button
                  style={{ background: "var(--app-brand-gradient)", color: "white", border: "none", borderRadius: "12px", padding: "10px 28px", boxShadow: "var(--app-card-shadow)" }}
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  Seleccionar imagen
                </Button>
                <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--layout-divider)" }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowSpecies((v) => !v); }}
                    className="w-full flex items-center justify-center gap-2 text-xs py-1 focus-visible:outline focus-visible:outline-2"
                    style={{ color: "var(--app-text-muted)", fontWeight: 600 }}
                    aria-expanded={showSpecies}
                  >
                    {showSpecies ? "Ocultar especies" : `Ver ${SPECIES_TAGS.length} especies soportadas`}
                    <motion.span animate={{ rotate: showSpecies ? 180 : 0 }}><ChevronDown size={14} /></motion.span>
                  </button>
                  <AnimatePresence>
                    {showSpecies && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2 justify-center mt-3">
                          {SPECIES_TAGS.map((a) => (
                            <span key={a} className="px-3 py-1 rounded-full text-xs" style={{ background: "var(--app-tag-bg)", color: "var(--app-tag-text)", border: "1px solid var(--app-tag-border)" }}>{a}</span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* UPLOADING - Real time */}
          {phase === "uploading" && (
            <motion.div key="uploading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl overflow-hidden"
              style={{ background: "var(--app-card-bg)", backdropFilter: "blur(10px)", boxShadow: "var(--app-card-shadow)", border: "1px solid var(--app-card-border)" }}
            >
              {/* Image preview */}
              <div className="relative w-full" style={{ height: 200 }}>
                {imageUrl && <img src={imageUrl} alt="upload" className="w-full h-full object-cover" />}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(99,102,241,0.5))" }} />
                {/* Upload progress overlay */}
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="h-1.5 w-full" style={{ background: "rgba(255,255,255,0.3)" }}>
                    <motion.div
                      className="h-full"
                      style={{ background: "linear-gradient(90deg, #6EE7B7, #34D399)" }}
                      animate={{ width: `${metrics.uploadProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <div className="px-3 py-1 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.9)", color: "#6366F1", fontWeight: 700 }}>
                    {metrics.uploadProgress.toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Speed + time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <RefreshCw size={16} style={{ color: "#6366F1" }} />
                    </motion.div>
                    <span className="text-sm" style={{ fontWeight: 600, color: "var(--app-text)" }}>Subiendo en tiempo real...</span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>{formatBytes(metrics.uploadedBytes)} / {formatBytes(metrics.totalBytes)}</span>
                </div>

                {/* Real-time metrics grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: <Wifi size={14} />, label: "Velocidad", value: `${metrics.uploadSpeedKBps.toFixed(0)} KB/s`, color: "#06B6D4" },
                    { icon: <Clock size={14} />, label: "Tiempo", value: formatMs(metrics.elapsedMs), color: "#F59E0B" },
                    { icon: <Cpu size={14} />, label: "CPU", value: `${metrics.cpuUsage.toFixed(0)}%`, color: "#8B5CF6" },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl px-3 py-2 text-center" style={{ background: "var(--app-metric-tile-bg)", border: "1px solid var(--app-metric-tile-border)" }}>
                      <div className="flex items-center justify-center gap-1 mb-1" style={{ color: m.color }}>
                        {m.icon}
                        <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>{m.label}</span>
                      </div>
                      <p className="text-sm" style={{ color: m.color, fontWeight: 700 }}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Live bars */}
                <div className="space-y-2.5">
                  <LiveMetricBar label="CPU" value={metrics.cpuUsage} max={100} color="#8B5CF6" unit="%" />
                  <LiveMetricBar label="RAM" value={metrics.memoryMB} max={512} color="#F97316" unit=" MB" />
                  <LiveMetricBar label="Red" value={metrics.uploadSpeedKBps} max={5000} color="#06B6D4" unit=" KB/s" />
                </div>

                {/* Timeout warning */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: "var(--app-warning-bg)", border: "1px solid var(--app-warning-border)", color: "var(--app-warning-text)" }}>
                  <Clock size={13} />
                  <span>Tiempo límite: 10s · Transcurrido: {formatMs(metrics.elapsedMs)}</span>
                  <div className="flex-1 h-1 rounded-full overflow-hidden ml-1" style={{ background: "#FEF3C7" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: metrics.elapsedMs > 7000 ? "#EF4444" : "#F59E0B" }}
                      animate={{ width: `${Math.min((metrics.elapsedMs / MAX_COMM_TIME_MS) * 100, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCANNING */}
          {phase === "scanning" && (
            <motion.div key="scanning" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl p-6 text-center"
              style={{ background: "var(--app-card-bg)", backdropFilter: "blur(10px)", boxShadow: "var(--app-card-shadow)", border: "1px solid var(--app-card-border)" }}
            >
              <div className="relative w-full max-w-sm mx-auto mb-5 rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                {imageUrl && <img src={imageUrl} alt="Scanning" className="w-full h-full object-cover" />}
                <div className="absolute inset-0" style={{ background: "rgba(15,20,50,0.35)" }} />
                <motion.div className="absolute left-0 right-0 h-1"
                  style={{ background: "linear-gradient(90deg, transparent, #6EE7B7, #34D399, #6EE7B7, transparent)", boxShadow: "0 0 20px #34D399" }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                {[
                  { top: 12, left: 12 }, { top: 12, right: 12 },
                  { bottom: 12, left: 12 }, { bottom: 12, right: 12 },
                ].map((pos, i) => (
                  <div key={i} className="absolute w-7 h-7" style={{
                    ...pos,
                    borderTop: i < 2 ? "3px solid #34D399" : "none",
                    borderBottom: i >= 2 ? "3px solid #34D399" : "none",
                    borderLeft: i % 2 === 0 ? "3px solid #34D399" : "none",
                    borderRight: i % 2 !== 0 ? "3px solid #34D399" : "none",
                  }} />
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-14 h-14 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: "#34D399", background: "rgba(52,211,153,0.1)" }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: "#34D399" }} />
                  </motion.div>
                </div>
              </div>
              <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <h3 style={{ color: "var(--app-success-text)", fontWeight: 700, fontSize: "1.1rem" }}>Analizando patrones...</h3>
              </motion.div>
              <p className="text-xs mt-1" style={{ color: "var(--app-text-muted)" }}>Analizando patrones visuales...</p>
              <div className="flex justify-center gap-5 mt-4 text-xs" style={{ color: "var(--app-text-muted)" }}>
                {["Forma", "Textura", "Color", "Patrones"].map((label, i) => (
                  <motion.div key={label} className="flex flex-col items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.4 }}>
                    <motion.div className="w-2 h-2 rounded-full"
                      animate={{ scale: [1, 1.5, 1], backgroundColor: ["#D1FAE5", "#10B981", "#D1FAE5"] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.4 }}
                    />
                    {label}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TIMEOUT */}
          {phase === "timeout" && (
            <motion.div key="timeout" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="rounded-3xl p-8 text-center space-y-4"
              style={{ background: "var(--app-card-bg)", backdropFilter: "blur(10px)", boxShadow: "var(--app-card-shadow)", border: "1px solid var(--app-card-border)" }}
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--app-error-bg)" }}>
                <Clock size={36} style={{ color: "var(--app-error-text)" }} />
              </div>
              <h3 style={{ color: "var(--app-error-text)", fontWeight: 700, fontSize: "1.2rem" }}>Tiempo de espera agotado</h3>
              <p className="text-sm" style={{ color: "var(--app-text-muted)" }}>El tiempo máximo de 10 segundos fue superado. El registro fue guardado en la base de datos.</p>
              <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: "var(--app-error-bg)", color: "var(--app-error-text)", border: "1px solid var(--app-error-border)" }}>
                ⏱ Tiempo de comunicación: {formatMs(scanMetrics.commMs)} · Estado: <strong>TIMEOUT</strong>
              </div>
              <Button onClick={handleReset} style={{ background: "var(--app-brand-gradient)", color: "white", border: "none", borderRadius: "12px" }}>
                Intentar de nuevo
              </Button>
            </motion.div>
          )}

          {/* RESULT */}
          {phase === "result" && prediction && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="space-y-4">

              {/* Main result */}
              <div className="rounded-3xl overflow-hidden" style={{ background: "var(--app-card-bg)", backdropFilter: "blur(10px)", boxShadow: "var(--app-card-shadow)", border: "1px solid var(--app-card-border)" }}>
                <div className="relative w-full mx-auto max-w-full" style={{ maxHeight: 280, boxShadow: "inset 0 0 0 3px var(--app-accent-soft)" }}>
                  <img src={imageUrl!} alt="Resultado del escaneo" className="w-full object-cover" style={{ maxHeight: 280 }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)" }} />
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                      style={{ background: "rgba(255,255,255,0.95)", color: "#4F46E5", fontWeight: 600 }}
                    >
                      <Sparkles size={14} /> Análisis IA
                    </motion.div>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35, type: "spring", stiffness: 200 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                      style={{ background: "rgba(255,255,255,0.95)", color: "#059669", fontWeight: 600 }}
                    >
                      <CheckCircle2 size={16} /> Identificado
                    </motion.div>
                  </div>
                  <div className="absolute bottom-4 left-5">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                      <span className="text-5xl">{prediction.main.emoji}</span>
                      <h2 className="text-white mt-1" style={{ fontSize: "1.7rem", fontWeight: 700 }}>{prediction.main.name}</h2>
                      <p className="text-white/70 text-xs italic">{prediction.main.description}</p>
                    </motion.div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: "var(--app-text-muted)" }}>Nivel de certeza</span>
                    <Badge style={{ background: "var(--app-success-bg)", color: "var(--app-success-text)", border: "1px solid var(--app-success-border)" }}>
                      {getConfidenceLabel(prediction.main.confidence)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--layout-muted-track)" }}>
                        <motion.div className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${getConfidenceColor(prediction.main.confidence)}, ${getConfidenceColor(prediction.main.confidence)}99)` }}
                          initial={{ width: "0%" }} animate={{ width: `${prediction.main.confidence}%` }}
                          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    <motion.span className="text-lg min-w-[60px] text-right" style={{ color: getConfidenceColor(prediction.main.confidence), fontWeight: 700 }}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    >
                      {prediction.main.confidence.toFixed(1)}%
                    </motion.span>
                  </div>
                  <div className="mt-3 px-4 py-2.5 rounded-2xl flex items-center gap-3" style={{ background: "var(--layout-profile-bg)", border: "1px solid var(--layout-divider)" }}>
                    <span className="text-xl">🏷️</span>
                    <div>
                      <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>Categoría</p>
                      <p className="text-sm" style={{ fontWeight: 600, color: "var(--app-text)" }}>{prediction.main.category}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scan metrics detail */}
              {savedLog && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  className="rounded-3xl overflow-hidden"
                  style={{ background: "var(--app-card-bg)", boxShadow: "var(--app-card-shadow)", border: "1px solid var(--app-card-border)" }}
                >
                  <button
                    type="button"
                    onClick={() => setShowMetricsDetail(!showMetricsDetail)}
                    className="w-full px-5 py-4 flex items-center justify-between focus-visible:outline focus-visible:outline-2"
                    aria-expanded={showMetricsDetail}
                  >
                    <div className="flex items-center gap-2">
                      <Activity size={16} style={{ color: "var(--layout-nav-text-active)" }} />
                      <span className="text-sm" style={{ fontWeight: 600, color: "var(--app-text)" }}>Métricas del escaneo</span>
                    </div>
                    <motion.div animate={{ rotate: showMetricsDetail ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} style={{ color: "var(--app-text-muted)" }} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {showMetricsDetail && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                          {[
                            { icon: <Wifi size={14} />, label: "T. Comunicación", value: formatMs(savedLog.communicationTimeMs), color: "#06B6D4" },
                            { icon: <Clock size={14} />, label: "T. de respuesta", value: formatMs(savedLog.responseTimeMs), color: "#F59E0B" },
                            { icon: <Cpu size={14} />, label: "Uso CPU", value: `${savedLog.cpuUsage.toFixed(1)}%`, color: "#8B5CF6" },
                            { icon: <MemoryStick size={14} />, label: "Uso RAM", value: `${savedLog.memoryUsageMB.toFixed(1)} MB`, color: "#F97316" },
                            { icon: <Activity size={14} />, label: "Vel. Red", value: `${savedLog.networkSpeedKBps.toFixed(0)} KB/s`, color: "#10B981" },
                            { icon: <CheckCircle2 size={14} />, label: "Estado", value: savedLog.timedOut ? "TIMEOUT" : "OK", color: savedLog.timedOut ? "#EF4444" : "#10B981" },
                          ].map(m => (
                            <div key={m.label} className="rounded-xl px-3 py-2.5" style={{ background: "var(--app-metric-tile-bg)", border: "1px solid var(--app-metric-tile-border)" }}>
                              <div className="flex items-center gap-1.5 mb-1" style={{ color: m.color }}>
                                {m.icon}
                                <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>{m.label}</span>
                              </div>
                              <p className="text-sm" style={{ color: m.color, fontWeight: 700 }}>{m.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="px-5 pb-4">
                          {saveError ? (
                            <div className="px-3 py-2 rounded-xl text-xs text-center" style={{ background: "var(--app-error-bg)", color: "var(--app-error-text)", border: "1px solid var(--app-error-border)" }}>
                              No se guardó en Firestore: {saveError}
                            </div>
                          ) : firestoreDocId ? (
                            <div className="px-3 py-2 rounded-xl text-xs text-center" style={{ background: "var(--app-success-bg)", color: "var(--app-success-text)", border: "1px solid var(--app-success-border)" }}>
                              Registro guardado en Firestore · ID: {firestoreDocId}
                            </div>
                          ) : (
                            <div className="px-3 py-2 rounded-xl text-xs text-center" style={{ background: "var(--layout-profile-bg)", border: "1px solid var(--layout-divider)", color: "var(--app-text-muted)" }}>
                              Guardando en Firestore…
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center">
                <Button onClick={handleReset} className="px-8 py-3 rounded-2xl" style={{ background: "var(--app-brand-gradient)", color: "white", border: "none" }}>
                  <RefreshCw size={16} className="mr-2" />
                  Escanear otra imagen
                </Button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
    </div>
  );
}
