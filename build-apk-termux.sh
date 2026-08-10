#!/data/data/com.termux/files/usr/bin/bash
set -e

cd "$(dirname "$0")"

echo "🔍 NDK kontrolü..."
if ! bash check-ndk.sh; then
    echo ""
    echo "Önce NDK kurulmalı:"
    echo "   bash install-ndk-termux.sh"
    exit 1
fi

echo ""
echo "📦 npm install"
npm install

echo "🛠 vite build"
npm run build

echo "📲 cap sync android"
npx cap sync android

echo "🤖 gradle assembleDebug"
cd android
chmod +x gradlew
./gradlew assembleDebug

APK="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
    cp "$APK" ~/storage/downloads/mini.apk
    echo "🎉 APK hazır: ~/storage/downloads/mini.apk"
else
    echo "❌ APK bulunamadı"
    exit 1
fi
