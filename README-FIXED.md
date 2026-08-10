# Mini AI — Düzeltilmiş Offline APK

Bu klasör senin yüklediğin tam proje üzerinden **düzeltilmiş** halidir. Yeni kod yazılmadı, sadece kırık yerler onarıldı ve offline yapay zeka gerçek hale getirildi.

## Yapılan düzeltmeler

1. `android/app/src/main/java/com/mini/plugins/LlamaPlugin.java` — `downloadModel` metodu sınıf dışına kaymıştı, düzeltildi; `getDownloadStatus`, `isModelLoaded`, `getModelRecommendation` eklendi.
2. `android/app/src/main/java/com/mini/app/MainActivity.java` — `LlamaPlugin` kaydı eksikti, eklendi.
3. `android/app/src/main/cpp/CMakeLists.txt` — `llama_jni.cpp` derleme listesine eklenmemişti, eklendi.
4. `android/app/src/main/cpp/llama_jni.cpp` — token üretim döngüsü bozuktu; prompt decode + üretim döngüsü doğru şekilde yazıldı.
5. `src/pages/Index.tsx` — çevrimiçi/çevrimdışı mod seçimli, basit arayüz ile değiştirildi.
6. `android/app/src/main/assets/ai_list.json` — model listesi eklendi.
7. `android/android` tekrarlanmış klasörü ve `.cxx` build artıkları temizlendi.

## Termux'ta build

### 1. Android NDK kurulumu (TEK SEFER, çok önemli)

Google'ın resmi NDK r25 paketi **Termux'a uygun değil** (içinde `linux-aarch64` derleyici yok). Bu yüzden build hata veriyor. Termux için ARM64 derleyicisi olan NDK r29 kur:

```bash
pkg install -y p7zip wget
mkdir -p ~/android-sdk/ndk
rm -rf ~/android-sdk/ndk/29.0.0
wget https://github.com/lzhiyong/termux-ndk/releases/download/android-ndk/android-ndk-r29-aarch64.7z -O ~/ndk.7z
7z x ~/ndk.7z -o~/android-sdk/ndk/
mv ~/android-sdk/ndk/android-ndk-r29 ~/android-sdk/ndk/29.0.0
rm ~/ndk.7z
```

Sonra proje içinde `android/local.properties` dosyasındaki NDK yolunu şuna göre güncelle:

```properties
sdk.dir=/data/data/com.termux/files/home/android-sdk
ndk.dir=/data/data/com.termux/files/home/android-sdk/ndk/29.0.0
```

### 2. Build

```bash
cd ~/mini-native-fixed
pkg install -y nodejs-lts openjdk-17 gradle git wget unzip which
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

APK çıktısı:
`android/app/build/outputs/apk/debug/app-debug.apk`

Kurulum:
```bash
cp android/app/build/outputs/apk/debug/app-debug.apk ~/storage/downloads/mini.apk
```

## Önemli notlar

- İlk açılışta **Çevrimdışı** modu seç, istediğin GGUF modelini indir. İnternet sadece model indirme aşamasında gerekli; yüklendikten sonra tamamen offline çalışır.
- Model dosyaları `/storage/emulated/0/Android/data/com.mini.app/files/Downloads/` içine kaydedilir.
- Build sırasında native C++ (llama.cpp) arm64 için derlenir; bu aşama biraz zaman alabilir.
