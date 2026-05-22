export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
  role: "admin" | "user";
}

export interface ScanLog {
  id: string;
  userId: string;
  username: string;
  timestamp: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  animalDetected: string;
  animalEmoji: string;
  confidence: number;
  uploadStartTime: number;
  uploadEndTime: number;
  scanStartTime: number;
  scanEndTime: number;
  communicationTimeMs: number;
  responseTimeMs: number;
  totalTimeMs: number;
  timedOut: boolean;
  cpuUsage: number;
  memoryUsageMB: number;
  networkSpeedKBps: number;
  status: "success" | "timeout" | "error";
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
