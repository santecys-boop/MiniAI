import { useState, useEffect } from 'react';
import SystemAnalyzer, { SystemInfo } from '@/plugins/SystemAnalyzer';

interface SystemScore {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'ultra';
  color: string;
  recommendations: string[];
}

function calculateScore(info: SystemInfo): SystemScore {
  const ramGB = info.ram.totalMB / 1024;
  const cpuCores = info.cpu.cores;
  const storageGB = info.storage.totalMB / 1024;
  const batteryPercent = info.battery.percent;
  
  let score = 0;
  const recommendations: string[] = [];
  
  // RAM puanı (max 40)
  if (ramGB >= 8) { score += 40; recommendations.push("✅ RAM harika, büyük modeller çalışabilir"); }
  else if (ramGB >= 6) { score += 35; recommendations.push("✅ RAM yeterli, orta modeller çalışır"); }
  else if (ramGB >= 4) { score += 25; recommendations.push("⚠️ RAM sınırda, hafif modeller önerilir"); }
  else { score += 15; recommendations.push("❌ RAM düşük, sadece mini modeller"); }
  
  // CPU puanı (max 30)
  if (cpuCores >= 8) { score += 30; }
  else if (cpuCores >= 6) { score += 25; }
  else if (cpuCores >= 4) { score += 20; }
  else { score += 10; }
  
  // Pil durumu (max 20)
  if (batteryPercent > 80) { score += 20; }
  else if (batteryPercent > 50) { score += 15; recommendations.push("⚡ Pil orta seviye, uzun kullanımda dikkat"); }
  else if (batteryPercent > 20) { score += 10; recommendations.push("🔋 Pil düşük, sadece hafif modeller"); }
  else { score += 5; recommendations.push("🪫 Pil kritik, şarja takman önerilir"); }
  
  // Depolama (max 10)
  if (storageGB > 64) { score += 10; }
  else if (storageGB > 32) { score += 8; }
  else if (storageGB > 16) { score += 5; }
  else { score += 3; recommendations.push("💾 Depolama az, model indirmede sorun olabilir"); }
  
  let level: SystemScore['level'];
  let color: string;
  
  if (score >= 80) { level = 'ultra'; color = '#00ff88'; }
  else if (score >= 60) { level = 'high'; color = '#4caf50'; }
  else if (score >= 40) { level = 'medium'; color = '#ff9800'; }
  else { level = 'low'; color = '#f44336'; }
  
  return { score, level, color, recommendations };
}

export function useSystemAnalyzer() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [score, setScore] = useState<SystemScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function analyze() {
      try {
        const result = await SystemAnalyzer.getSystemInfo();
        const info = result.value;
        setSystemInfo(info);
        setScore(calculateScore(info));
      } catch (e) {
        setError('Sistem analizi başarısız: ' + e);
      } finally {
        setLoading(false);
      }
    }
    analyze();
  }, []);
  
  return { systemInfo, score, loading, error };
}
