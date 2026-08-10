# Mini — Gerçek Native APK (Termux Build)

Bu APK kodu içine gömer. Offline çalışır, internet yokken de açılır (backend istekleri hariç).
Güncelleme için APK'yı YENİDEN build edip kurman gerekir.

## Termux'ta gerekli paketler (bir kere)

```bash
pkg update && pkg upgrade -y
pkg install -y nodejs-lts openjdk-17 gradle git wget unzip which
```

## Android SDK (Termux için)

```bash
mkdir -p ~/android-sdk/cmdline-tools && cd ~/android-sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmd.zip
unzip cmd.zip && mv cmdline-tools latest && rm cmd.zip
export ANDROID_HOME=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

Kalıcı yap:
```bash
echo 'export ANDROID_HOME=~/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0' >> ~/.bashrc
source ~/.bashrc
```

## Build

```bash
unzip mini-native-apk.zip -d mini-native && cd mini-native
npm install
npm run build            # dist/ üretir
npx cap add android
npx cap sync android     # dist/'i android'e kopyalar
cd android
./gradlew assembleDebug
```

APK burada:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Kur

```bash
cp android/app/build/outputs/apk/debug/app-debug.apk ~/storage/downloads/mini.apk
```
Dosya yöneticisinden mini.apk'a tıkla, kur.

## Güncelleme (ÖNEMLİ)

Kodda değişiklik yapınca:
```bash
cd mini-native
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```
Yeni APK'yı tekrar kur (üstüne yazacak).
