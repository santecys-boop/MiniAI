// Bildirim ve Kredi Sistemi

export function setupNotifications() {
  // Kredi yenileme kontrolü
  checkCredits();
  
  // Her saat başı kontrol et
  setInterval(checkCredits, 3600000);
  
  // Sabah bildirimi için zaman kontrolü
  scheduleMorningNotification();
}

function checkCredits() {
  const today = new Date().toDateString();
  const lastReset = localStorage.getItem('mini-credit-date');
  
  if (lastReset !== today) {
    // Yeni gün, kredileri sıfırla
    localStorage.setItem('mini-credit-date', today);
    localStorage.setItem('mini-credits', '100');
    
    // Gece 12'den sonra yenilendiyse bildirim
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
      showLocalNotification('🌙 Kredilerin Yenilendi!', 'Gece yenilendi, 100 kredi hazır!');
    }
  }
}

function scheduleMorningNotification() {
  const now = new Date();
  const morning = new Date(now);
  morning.setHours(7, 0, 0, 0);
  
  if (now > morning) {
    morning.setDate(morning.getDate() + 1);
  }
  
  const timeUntilMorning = morning.getTime() - now.getTime();
  
  setTimeout(() => {
    showLocalNotification('☀️ Günaydın!', 'Kredilerin hazır, hemen gir ve keyfini çıkar! 🚀');
    // Her gün tekrarla
    setInterval(() => {
      const h = new Date().getHours();
      if (h >= 7 && h <= 10) {
        showLocalNotification('☀️ Günaydın!', 'Kredilerin hazır, hemen gir ve keyfini çıkar! 🚀');
      }
    }, 3600000);
  }, timeUntilMorning);
}

function showLocalNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

// Güncelleme kontrolü
export async function checkUpdate(): Promise<boolean> {
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/updates?select=version&order=created_at.desc&limit=1`, {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      }
    });
    const data = await res.json();
    const latestVersion = data[0]?.version || '1.0.0';
    const currentVersion = localStorage.getItem('mini-version') || '1.0.0';
    return latestVersion !== currentVersion;
  } catch {
    return false;
  }
}

export function getCredits(): number {
  return parseInt(localStorage.getItem('mini-credits') || '100');
}

export function spendCredit(): boolean {
  const credits = getCredits();
  if (credits > 0) {
    localStorage.setItem('mini-credits', String(credits - 1));
    return true;
  }
  return false;
}
