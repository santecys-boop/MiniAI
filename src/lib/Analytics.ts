// Gelişmiş Analitik ve Raporlama Sistemi

interface EventLog {
  timestamp: string;
  type: 'page_view' | 'click' | 'error' | 'ai_request' | 'terminal' | 'login' | 'system';
  action: string;
  details?: string;
  deviceInfo: {
    ip?: string;
    location?: string;
    ram?: number;
    cpu?: number;
    battery?: number;
    online: boolean;
    screenSize: string;
    userAgent: string;
    platform: string;
    language: string;
  };
}

class Analytics {
  private logs: EventLog[] = [];
  private sessionStart: string;
  private errorCount = 0;
  private aiRequestCount = 0;
  private terminalCommandCount = 0;
  private ipAddress = '';
  private location = '';

  constructor() {
    this.sessionStart = new Date().toISOString();
    this.loadLogs();
    this.getIPAndLocation();
    
    setInterval(() => this.saveLogs(), 30000);
    window.addEventListener('beforeunload', () => this.saveLogs());
    window.addEventListener('error', (e) => this.track('error', 'global_error', e.message));
  }

  async getIPAndLocation() {
    try {
      // IP ve konum al
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      this.ipAddress = data.ip || '';
      this.location = `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`;
    } catch {
      this.ipAddress = 'Bilinmiyor';
      this.location = 'Bilinmiyor';
    }
  }

  track(type: EventLog['type'], action: string, details?: string) {
    const event: EventLog = {
      timestamp: new Date().toISOString(),
      type, action, details,
      deviceInfo: {
        ip: this.ipAddress,
        location: this.location,
        online: navigator.onLine,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: navigator.userAgent.slice(0, 100),
        platform: navigator.platform || 'Unknown',
        language: navigator.language,
      }
    };

    this.logs.push(event);
    if (type === 'error') this.errorCount++;
    if (type === 'ai_request') this.aiRequestCount++;
    if (type === 'terminal') this.terminalCommandCount++;

    this.saveLogs();
    
    // Supabase'e gönder (varsa)
    this.sendToServer(event);
    
    return event;
  }

  async sendToServer(event: EventLog) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      await fetch(`${supabaseUrl}/rest/v1/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          type: event.type,
          action: event.action,
          details: event.details,
          ip: event.deviceInfo.ip,
          location: event.deviceInfo.location,
          screen: event.deviceInfo.screenSize,
          platform: event.deviceInfo.platform,
          user_agent: event.deviceInfo.userAgent,
        })
      });
    } catch {}
  }

  getFullReport(): string {
    const duration = Math.round((Date.now() - new Date(this.sessionStart).getTime()) / 1000 / 60);
    return `
╔══════════════════════════════════╗
║     📊 OTURUM RAPORU           ║
╚══════════════════════════════════╝

🕐 Süre: ${duration} dakika
📅 Başlangıç: ${new Date(this.sessionStart).toLocaleString('tr-TR')}

👤 KULLANICI:
  Durum: ${localStorage.getItem('mini-auth') ? 'Giriş yaptı' : 'Misafir'}
  AI Mod: ${localStorage.getItem('mini-ai-mode') || 'online'}

🌐 AĞ:
  IP: ${this.ipAddress}
  Konum: ${this.location}
  Çevrimiçi: ${navigator.onLine ? '✅' : '❌'}

📱 CİHAZ:
  Ekran: ${window.innerWidth}x${window.innerHeight}
  Platform: ${navigator.platform}
  Dil: ${navigator.language}
  Tarayıcı: ${navigator.userAgent.slice(0, 80)}...

📈 İSTATİSTİK:
  ❌ Hatalar: ${this.errorCount}
  🤖 AI İstekleri: ${this.aiRequestCount}
  💻 Terminal: ${this.terminalCommandCount}
  📝 Toplam: ${this.logs.length}

📋 SON OLAYLAR:
${this.logs.slice(-15).map(l => 
  `  [${l.timestamp.slice(11, 19)}] ${this.getIcon(l.type)} ${l.action}${l.details ? ': ' + l.details.slice(0, 50) : ''}`
).join('\n')}

🔧 SİSTEM:
  RAM: ${navigator.deviceMemory || 'Bilinmiyor'}GB
  Bağlantı: ${(navigator as any).connection?.effectiveType || 'Bilinmiyor'}
    `.trim();
  }

  private getIcon(type: string): string {
    const icons: Record<string, string> = {
      error: '❌', ai_request: '🤖', terminal: '💻',
      login: '👤', page_view: '👁️', click: '👆', system: '⚙️'
    };
    return icons[type] || '📌';
  }

  getErrorReport(): string {
    const errors = this.logs.filter(l => l.type === 'error');
    return errors.length === 0 ? '✅ Hiç hata yok!' :
      errors.map(e => `[${e.timestamp.slice(11, 19)}] ${e.action}: ${e.details}`).join('\n');
  }

  private loadLogs() {
    try {
      const saved = localStorage.getItem('mini-analytics');
      if (saved) this.logs = JSON.parse(saved);
    } catch {}
  }

  private saveLogs() {
    try {
      if (this.logs.length > 1000) this.logs = this.logs.slice(-1000);
      localStorage.setItem('mini-analytics', JSON.stringify(this.logs));
    } catch {}
  }

  clearLogs() {
    this.logs = [];
    this.errorCount = 0;
    this.aiRequestCount = 0;
    this.terminalCommandCount = 0;
    localStorage.removeItem('mini-analytics');
  }
}

export const analytics = new Analytics();
export default analytics;
