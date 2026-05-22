import { ScanLog } from "../types";
import { db } from "../lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  limit,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";

const COLLECTION = "scanLogs";
const MAX_LOGS = 500;

export async function getLogs(): Promise<ScanLog[]> {
  const q = query(collection(db, COLLECTION), orderBy("timestamp", "desc"), limit(MAX_LOGS));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ScanLog);
}

export async function addLog(log: ScanLog): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), log);
  return ref.id;
}

export async function clearLogs(): Promise<void> {
  const q = query(collection(db, COLLECTION), orderBy("timestamp", "desc"), limit(MAX_LOGS));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export function getStatsFromLogs(logs: ScanLog[]) {
  if (logs.length === 0) return null;
  const success = logs.filter((l) => l.status === "success");
  const avgResponse = success.reduce((a, b) => a + b.responseTimeMs, 0) / (success.length || 1);
  const avgComm = success.reduce((a, b) => a + b.communicationTimeMs, 0) / (success.length || 1);
  const avgConf = success.reduce((a, b) => a + b.confidence, 0) / (success.length || 1);
  const avgCpu = logs.reduce((a, b) => a + b.cpuUsage, 0) / logs.length;
  const avgMem = logs.reduce((a, b) => a + b.memoryUsageMB, 0) / logs.length;
  const timeouts = logs.filter((l) => l.timedOut).length;

  return {
    total: logs.length,
    success: success.length,
    timeouts,
    errors: logs.filter((l) => l.status === "error").length,
    avgResponseMs: Math.round(avgResponse),
    avgCommMs: Math.round(avgComm),
    avgConfidence: avgConf.toFixed(1),
    avgCpu: avgCpu.toFixed(1),
    avgMemMB: avgMem.toFixed(1),
  };
}

export async function getStats() {
  const logs = await getLogs();
  return getStatsFromLogs(logs);
}
