# Dosya Düzenle özelliği — ne değişti

## Frontend (Index.tsx)
Buton/yeni arayüz YOK. Mevcut ataç (📎) ile bir dosya ya da .zip yükleyip,
mesaj kutusuna ne yapılmasını istediğini yaz (örn. "bu dosyayı düzenle,
header rengini laciverte çevir"). Sistem otomatik algılar:

- Dosya eklenmiş VE mesajda düzenleme fiili varsa ("düzenle", "değiştir",
  "güncelle", "ekle", "sil", "fix", "edit" vb.) → agent-file-edit'e gider.
- Aksi halde eskisi gibi davranır (site kurma → agent-run, sohbet → generate-site).

Değişenler:
1. `handleFilePick`: zip dosyaları artık base64 (readAsDataURL) ile okunuyor
   — eskiden `f.text()` kullanılıyordu, bu zip gibi binary dosyaları bozardı.
   Zip olmayan dosyalar (kod, txt vb.) eskisi gibi text olarak okunuyor.
2. `send()` içine, mevcut E2B/agent-mode/generate-site dallarına dokunmadan,
   yeni bir `shouldUseFileEdit` dalı eklendi. `agent-run.ts` hiç değiştirilmedi.
3. Sonuç mesajındaki indirme linki (`autoUrl` alanı, zaten var olan) artık
   zip için `data:application/zip;base64,...` URL'i taşıyor ve linkin
   metni duruma göre "İndir" ya da "Canlı URL'i aç" oluyor.

## Backend (agent-file-edit/index.ts) — YENİ dosya, agent-run.ts'e dokunulmadı
`agent-run.ts` ile birebir aynı E2B çağrı pattern'i kullanılarak yazıldı
(`Sandbox.create`, `sandbox.files.write`, `sandbox.commands.run`,
`sandbox.kill()`, aynı `callWithFallback` AI çağrısı, aynı SSE event formatı).

Akış:
1. Sandbox açılır (agent-run.ts'teki ile aynı çağrı).
2. Yüklenen dosya sandbox'a yazılır; .zip ise gerçek `unzip` komutuyla açılır.
3. Sandbox'taki dosyalar gerçek `find`/`cat` komutlarıyla okunur.
4. Okunan içerik + kullanıcının talimatı `callWithFallback` ile AI'a verilir,
   AI hangi dosyaların nasıl değişeceğine karar verir (JSON plan döner).
5. Plan sandbox'ta gerçek dosya yazma/silme komutlarıyla uygulanır.
6. Sonuç gerçek `zip -r` komutuyla paketlenir.
7. Zip sandbox'tan okunup base64 olarak "done" event'i ile client'a döner
   (agent-run.ts'te olduğu gibi ayrı bir storage bucket'a ihtiyaç yok —
   sandbox URL yerine dosya döndüğü için base64 stream üzerinden taşınıyor).
8. Sandbox kapatılır.

## Kurulum
Supabase projende:

```bash
supabase functions new agent-file-edit
# oluşan dosyanın içeriğini agent-file-edit/index.ts ile değiştir
supabase functions deploy agent-file-edit --no-verify-jwt
```

Ekstra secret gerekmiyor — `E2B_API_KEY` zaten agent-run.ts için tanımlıysa
bu fonksiyon da onu kullanır. `callWithFallback`'in kullandığı sağlayıcı
anahtarları da (openrouter vb.) zaten projede tanımlı olduğundan aynen kalır.

## Dürüst not
`callWithFallback`'in içini (`_shared/providers.ts`) görmedim, sadece
agent-run.ts'in onu nasıl çağırdığını gördüm ve aynı imzayla
(`callWithFallback(messages[], "openrouter")` → `{text}`) çağırdım. Bu
dosya projende varsa (agent-run.ts çalışıyorsa vardır) sorunsuz çalışır.
