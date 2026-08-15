// Lovable-Level High-Tier SaaS Boilerplate & Template Library
import { ProjectFile } from "../types";

export interface SaasTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  sqlQueries: string[];
  files: ProjectFile[];
}

export const SAAS_TEMPLATES: SaasTemplate[] = [
  {
    id: "ecommerce-saas",
    name: "Modern E-Ticaret & Mağaza SaaS",
    category: "E-Commerce",
    description: "Ürün kataloğu, dinamik sepet, kategori filtreleme ve sipariş yönetim paneli içeren tam teşekküllü React SaaS.",
    sqlQueries: [
      `CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  stock INT DEFAULT 10
);`,
      `CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending'
);`,
      `ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;`
    ],
    files: [
      {
        path: "src/App.jsx",
        lang: "jsx",
        content: `import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import CartModal from './components/CartModal.jsx';
import AdminOrders from './pages/AdminOrders.jsx';

export default function App() {
  const [currentView, setCurrentView] = useState('store'); // 'store' | 'admin'
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product) => {
    setCart(prev => {
      const exist = prev.find(item => item.id === product.id);
      if (exist) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const totalCartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        cartCount={totalCartCount} 
        openCart={() => setIsCartOpen(true)} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'store' ? (
          <ProductGrid onAddToCart={addToCart} />
        ) : (
          <AdminOrders />
        )}
      </main>

      <CartModal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cart={cart} 
        setCart={setCart} 
      />
    </div>
  );
}`
      },
      {
        path: "src/components/Navbar.jsx",
        lang: "jsx",
        content: `import React from 'react';

export default function Navbar({ currentView, setCurrentView, cartCount, openCart }) {
  return (
    <header className="sticky top-0 z-30 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-bold">
          <i className="fa-solid fa-bag-shopping"></i>
        </div>
        <span className="font-bold text-base tracking-tight text-white">NovaStore SaaS</span>
      </div>

      <nav className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
        <button
          onClick={() => setCurrentView('store')}
          className={\`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors \${currentView === 'store' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}\`}
        >
          <i className="fa-solid fa-store mr-1.5"></i> Vitrin
        </button>
        <button
          onClick={() => setCurrentView('admin')}
          className={\`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors \${currentView === 'admin' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}\`}
        >
          <i className="fa-solid fa-chart-line mr-1.5"></i> Yönetim Paneli
        </button>
      </nav>

      <button
        onClick={openCart}
        className="relative flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-semibold text-xs transition-transform active:scale-95"
      >
        <i className="fa-solid fa-cart-shopping"></i>
        <span>Sepetim</span>
        {cartCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-zinc-950 text-amber-400 text-[10px] flex items-center justify-center font-bold">
            {cartCount}
          </span>
        )}
      </button>
    </header>
  );
}`
      },
      {
        path: "src/components/ProductGrid.jsx",
        lang: "jsx",
        content: `import React, { useState } from 'react';

const INITIAL_PRODUCTS = [
  { id: 'p1', name: 'Kablosuz Akıllı Kulaklık Pro', price: 1499.00, category: 'Elektronik', icon: 'headphones', rating: 4.8 },
  { id: 'p2', name: 'Minimalist Mekanik Klavye', price: 2199.50, category: 'Aksesuar', icon: 'keyboard', rating: 4.9 },
  { id: 'p3', name: 'Ergonomik Alüminyum Laptop Standı', price: 799.00, category: 'Ofis', icon: 'laptop', rating: 4.7 },
  { id: 'p4', name: '4K Ultra HD Ultra-Geniş Monitör', price: 8499.00, category: 'Elektronik', icon: 'desktop', rating: 5.0 },
];

export default function ProductGrid({ onAddToCart }) {
  const [filter, setFilter] = useState('Tümü');

  const categories = ['Tümü', 'Elektronik', 'Aksesuar', 'Ofis'];
  const filtered = filter === 'Tümü' ? INITIAL_PRODUCTS : INITIAL_PRODUCTS.filter(p => p.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Öne Çıkan Ürünler</h1>
          <p className="text-xs text-zinc-400">En son teknoloji ekipmanlar ve premium tasarım.</p>
        </div>

        <div className="flex gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={\`px-3 py-1 text-xs rounded-lg font-medium transition \${filter === c ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-white'}\`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map(p => (
          <div key={p.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 transition group shadow-lg">
            <div className="w-full aspect-square bg-zinc-950 rounded-xl flex items-center justify-center text-4xl text-amber-500 mb-4 border border-zinc-800/50 group-hover:scale-105 transition-transform">
              <i className={\`fa-solid fa-\${p.icon}\`}></i>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono text-zinc-500">{p.category}</span>
              <h3 className="font-semibold text-sm text-zinc-100 line-clamp-1">{p.name}</h3>
              <div className="flex items-center gap-1 text-amber-400 text-xs py-1">
                <i className="fa-solid fa-star text-[10px]"></i>
                <span>{p.rating}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-white font-mono">₺{p.price.toLocaleString('tr-TR')}</span>
              <button
                onClick={() => onAddToCart(p)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <i className="fa-solid fa-plus text-[10px]"></i> Ekle
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`
      },
      {
        path: "src/components/CartModal.jsx",
        lang: "jsx",
        content: `import React, { useState } from 'react';

export default function CartModal({ isOpen, onClose, cart, setCart }) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const removeItem = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setSuccessMsg('Siparişiniz başarıyla alındı! Teşekkür ederiz.');
      setCart([]);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-cart-shopping text-amber-400"></i>
            <h2 className="font-bold text-base text-white">Alışveriş Sepeti</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl">
              <i className="fa-solid fa-check"></i>
            </div>
            <p className="text-sm text-zinc-200 font-medium">{successMsg}</p>
            <button
              onClick={() => { setSuccessMsg(''); onClose(); }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs text-white"
            >
              Kapat
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            Sepetinizde henüz ürün bulunmuyor.
          </div>
        ) : (
          <>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-xs">
                  <div>
                    <h4 className="font-semibold text-zinc-200">{item.name}</h4>
                    <span className="text-zinc-500 font-mono">{item.qty} adet × ₺{item.price}</span>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-rose-400 hover:text-rose-300 p-1">
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-sm">
              <span className="text-zinc-400">Toplam:</span>
              <span className="font-bold text-amber-400 font-mono">₺{total.toLocaleString('tr-TR')}</span>
            </div>

            <button
              disabled={isCheckingOut}
              onClick={handleCheckout}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition active:scale-98 disabled:opacity-50"
            >
              {isCheckingOut ? 'Sipariş Gönderiliyor...' : 'Ödemeyi Tamamla'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}`
      },
      {
        path: "src/pages/AdminOrders.jsx",
        lang: "jsx",
        content: `import React, { useState } from 'react';

export default function AdminOrders() {
  const [orders] = useState([
    { id: 'ORD-1082', customer: 'Ahmet Yılmaz', total: 2998.00, status: 'Teslim Edildi', date: '15.08.2026' },
    { id: 'ORD-1083', customer: 'Zeynep Kaya', total: 8499.00, status: 'Hazırlanıyor', date: '15.08.2026' },
    { id: 'ORD-1084', customer: 'Mehmet Demir', total: 799.00, status: 'Kargoda', date: '14.08.2026' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Sipariş Yönetim Paneli</h1>
        <p className="text-xs text-zinc-400">Canlı sipariş akışı ve gelir analitiği.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          <span className="text-xs text-zinc-500 font-mono">Toplam Sipariş</span>
          <p className="text-xl font-bold text-white mt-1">128 Adet</p>
        </div>
        <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          <span className="text-xs text-zinc-500 font-mono">Bugünkü Gelir</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">₺24.850</p>
        </div>
        <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          <span className="text-xs text-zinc-500 font-mono">Bekleyen Kargolar</span>
          <p className="text-xl font-bold text-amber-400 mt-1">7 Adet</p>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 font-semibold text-xs text-zinc-300">
          Son Siparişler
        </div>
        <div className="divide-y divide-zinc-800/60 text-xs">
          {orders.map(o => (
            <div key={o.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition">
              <div>
                <span className="font-mono text-amber-400 font-medium">{o.id}</span>
                <p className="text-zinc-200 font-semibold mt-0.5">{o.customer}</p>
                <span className="text-[11px] text-zinc-500">{o.date}</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-white">₺{o.total.toLocaleString('tr-TR')}</span>
                <div className="mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {o.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`
      }
    ]
  },
  {
    id: "booking-saas",
    name: "Randevu & Rezervasyon SaaS",
    category: "Booking",
    description: "Tarih ve saat seçimi, uzman personeller, hizmet fiyatları ve takvim görünümü içeren randevu yönetim sistemi.",
    sqlQueries: [
      `CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_name TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed'
);`,
      `CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration_minutes INT DEFAULT 45,
  price NUMERIC(10,2) NOT NULL
);`,
      `ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;`
    ],
    files: [
      {
        path: "src/App.jsx",
        lang: "jsx",
        content: `import React, { useState } from 'react';

const SERVICES = [
  { id: 's1', name: 'Saç Kesim & Tasarım', duration: '45 dk', price: 450 },
  { id: 's2', name: 'Sakal Tıraşı & Bakım', duration: '30 dk', price: 250 },
  { id: 's3', name: 'Cilt Bakımı & Maske', duration: '60 dk', price: 600 },
];

const STAFF = ['Ahmet Usta', 'Caner Bey', 'Burak Uzman'];

export default function App() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [selectedStaff, setSelectedStaff] = useState(STAFF[0]);
  const [date, setDate] = useState('2026-08-16');
  const [time, setTime] = useState('14:00');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/60 p-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-calendar-check text-emerald-400 text-lg"></i>
          <span className="font-bold text-white">Apex Randevu SaaS</span>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono">
          Online Randevu Sistemi
        </span>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        {isSuccess ? (
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="text-xl font-bold text-white">Randevunuz Onaylandı!</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sayın <b>{customerName}</b>, {date} günü saat {time} için <b>{selectedService.name}</b> randevunuz <b>{selectedStaff}</b> ile oluşturulmuştur.
            </p>
            <button
              onClick={() => { setIsSuccess(false); setStep(1); }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-xs transition"
            >
              Yeni Randevu Al
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-bold text-white">Online Randevu Oluştur</h2>
              <p className="text-xs text-zinc-400 mt-1">İstediğiniz hizmeti, uzmanı ve uygun saatinizi belirleyin.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">1. Hizmet Seçin</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SERVICES.map(s => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedService(s)}
                      className={\`p-3 rounded-xl border text-xs cursor-pointer transition \${selectedService.id === s.id ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}\`}
                    >
                      <p className="font-medium text-white">{s.name}</p>
                      <span className="text-[11px] text-zinc-500">{s.duration} · ₺{s.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">2. Uzman Personel</label>
                <div className="flex gap-2">
                  {STAFF.map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStaff(st)}
                      className={\`flex-1 py-2 rounded-xl border text-xs font-medium transition \${selectedStaff === st ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'}\`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">3. Tarih</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">4. Saat</label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="10:00">10:00</option>
                    <option value="11:30">11:30</option>
                    <option value="14:00">14:00</option>
                    <option value="15:30">15:30</option>
                    <option value="17:00">17:00</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  required
                  placeholder="Adınız Soyadınız"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500"
                />
                <input
                  type="tel"
                  required
                  placeholder="Telefon Numaranız (05xx...)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition active:scale-98 shadow-lg shadow-emerald-500/10"
              >
                Randevuyu Onayla (₺{selectedService.price})
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}`
      }
    ]
  }
];
