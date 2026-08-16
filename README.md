# 🚀 Mini AI — Otonom Yapay Zeka & Çok Dosyalı SaaS Geliştirme Platformu

Mini AI, tarayıcı ve bulut VM (E2B Sandbox) üzerinde **gerçek otonom ajan döngüleri** (`Tool Calling & Self-Healing Loop`) ile çalışan, modüler React + TypeScript, Python ve tam teşekküllü SaaS web uygulamaları üreten yeni nesil bir yapay zeka platformudur.

---

## 🌟 Temel Mimari Özellikler

### 1. 🔄 Gerçek Otonom Ajan Döngüsü (`agentEngine.ts` & `agentDispatcher.ts`)
* **Tool Calling Döngüsü:** Model düz metin dökmek yerine iteratif `while (iterasyon < N)` döngüsü içerisinde yapılandırılmış araçları çağırır:
  * `write_file(path, content)`: Çok dosyalı modüler dosya (`src/App.tsx`, `src/pages/*.tsx`, `src/components/*.tsx`) yazar.
  * `line_replace(path, targetContent, replacementContent)`: Tüm dosyayı ezmek yerine cerrahi satır yaması (Surgical Patch) uygular.
  * `read_file(path)`: Mevcut dosyanın içeriğini inceler.
  * `list_files()`: Projedeki tüm dosya ağacını listeler.
  * `run_build()`: Projeyi gerçek AST ve TSX sentaks doğrulayıcısından geçirir.
  * `search_web(query)`: Canlı DuckDuckGo ve Jina AI araması yapar.

### 2. 🧪 Gerçek Derleyici & Sentaks Doğrulayıcısı (`codeCompilerValidator.ts`)
* Sahte div sayımı yerine; Babel Standalone, AST ve TSX sentaks denetimi uygular.
* Import Çözünürlüğü Denetimi: Eksik veya hatalı dosya importlarını yakalar.
* **Self-Healing Feedback:** Derleme hatası çıktığında hata çıktısı ve satır numarası modele geri beslenir ve model hatayı kendi kendine düzeltir.

### 3. 🚦 Sanal Modül Çözücü & Canlı Sandbox (`virtualModuleResolver.ts`)
* Tarayıcı içi Babel Standalone + TypeScript derleyicisi.
* Canlı `react-router-dom` emülatörü (`BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`, `useNavigate`, `useLocation`).
* Lucide React ikon motoru ve zengin Tailwind CSS entegrasyonu.

### 4. ☁️ Sunucu Tarafı E2B Linux VM Otonom Motoru (`supabase/functions/agent-run`)
* E2B Cloud Linux VM üzerinde çalışan `while (turn < MAX_TURNS && !testOk)` döngüsü.
* Gerçek `npm install`, sunucu başlatma (`PORT=3000 node server.js`) ve canlı `GET` testi ile hata düzeltme halkası.
* Proje tamamlandığında tüm dosya ağacının istemciye `snapshot` olarak aktarımı.

### 5. 💻 AI Terminal Köprüsü (`aiTerminalBridge.ts` ➔ `RealTerminal`)
* AI mesajında `[[TERM: <komut>]]` yazdığında komutlar sıralı olarak Piston ve Linux ortamında çalıştırılır, çıktılar canlı terminale ve sohbete yansıtılır.

### 6. 🌐 Canlı Web Arama Entegrasyonu (`webSearchService.ts`)
* Jina AI (`s.jina.ai`), Wikipedia API ve DuckDuckGo ile anlık veri taraması.

---

## 📁 Proje Dosya Yapısı

```
MiniAI/
├── src/
│   ├── components/            # UI ve Sandbox Bileşenleri
│   │   ├── MultiFileSandboxPreview.tsx   # Canlı Çok Dosyalı Önizleme
│   │   ├── RealTerminal.tsx              # Canlı AI Terminal Konsolu
│   │   ├── GeminiImageGeneratorCard.tsx  # Görsel Üretim Kartı
│   │   └── ...
│   ├── lib/
│   │   ├── agentEngine.ts                # Otonom Ajan & Tool Loop Motoru
│   │   ├── codeCompilerValidator.ts      # AST Sentaks & Derleyici Doğrulayıcısı
│   │   ├── virtualModuleResolver.ts      # Babel + TSX In-Browser Runtime
│   │   ├── aiTerminalBridge.ts           # [[TERM]] Terminal Köprüsü
│   │   └── ...
│   ├── services/
│   │   ├── agentDispatcher.ts            # Merkezi Ajan Yönlendiricisi & Snapshot
│   │   ├── aiProviderService.ts          # LLM7 & Multi-Key Vault Motoru
│   │   ├── webSearchService.ts           # Canlı Web Arama Motoru
│   │   └── ...
│   └── pages/
│       ├── Index.tsx                     # Ana Uygulama & Sohbet Arayüzü
│       └── ...
├── supabase/
│   └── functions/
│       ├── agent-run/index.ts            # E2B Linux VM Otonom Ajan Edge Function
│       ├── agent-file-edit/index.ts      # ZIP Proje Düzenleme Edge Function
│       └── terminal-exec/index.ts        # Piston Sandbox Terminal Function
└── public/
    └── miniai-latest.zip                 # En Güncel Proje ZIP Arşivi
```

---

## 🚀 Canlı Yayın ve Bağlantılar

* **Canlı Web Adresi:** [https://miniaii.surge.sh](https://miniaii.surge.sh)
* **Ayna 1:** [https://miniai-official.surge.sh](https://miniai-official.surge.sh)
* **Ayna 2:** [https://miniai-app.surge.sh](https://miniai-app.surge.sh)
* **Kaynak Kod & ZIP İndir:** [https://miniaii.surge.sh/miniai-latest.zip](https://miniaii.surge.sh/miniai-latest.zip)
