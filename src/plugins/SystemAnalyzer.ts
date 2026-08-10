import { registerPlugin } from '@capacitor/core';

export interface SystemInfo {
  ram: { totalMB: number; availableMB: number; usedMB: number };
  cpu: { cores: number; arch: string; model: string };
  battery: { percent: number; isCharging: boolean };
  device: { model: string; brand: string; androidVersion: string };
}

export interface SystemAnalyzerPlugin {
  getSystemInfo(): Promise<{ value: SystemInfo }>;
  saveAuth(options: { email: string }): Promise<{ value: { saved: boolean } }>;
  getAuth(): Promise<{ value: { email: string | null; hasAuth: boolean } }>;
  clearAuth(): Promise<void>;
  beep(): Promise<void>;
  showNotification(options: { title: string; body: string }): Promise<void>;
  requestNotificationPermission(): Promise<void>;
}

const SystemAnalyzer = registerPlugin<SystemAnalyzerPlugin>('SystemAnalyzer');
export default SystemAnalyzer;
