#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "🔧 Termux için ARM64 NDK (r29) kurulumu"
echo ""



mkdir -p "$HOME/android-sdk/ndk"
rm -rf "$HOME/android-sdk/ndk/29.0.0"

DL_URL="https://github.com/lzhiyong/termux-ndk/releases/download/android-ndk/android-ndk-r29-aarch64.7z"
TMP_ARC="$HOME/ndk-r29-aarch64.7z"

echo "⬇️  NDK r29 indiriliyor (~333 MB)..."
rm -f "$TMP_ARC"
curl -L -o "$TMP_ARC" "$DL_URL"

if [ ! -f "$TMP_ARC" ] || [ ! -s "$TMP_ARC" ]; then
    echo "❌ İndirme başarısız oldu"
    exit 1
fi

echo "📦 Çıkartılıyor..."
7z x "$TMP_ARC" -o"$HOME/android-sdk/ndk/"

if [ -d "$HOME/android-sdk/ndk/android-ndk-r29" ]; then
    mv "$HOME/android-sdk/ndk/android-ndk-r29" "$HOME/android-sdk/ndk/29.0.0"
fi

rm -f "$TMP_ARC"

if [ ! -f "$HOME/android-sdk/ndk/29.0.0/toolchains/llvm/prebuilt/linux-aarch64/bin/clang" ]; then
    echo "❌ NDK içinde ARM64 derleyici bulunamadı"
    exit 1
fi

echo "✅ NDK kuruldu: $HOME/android-sdk/ndk/29.0.0"

cd "$(dirname "$0")"
PROJ_DIR="$(pwd)"
if [ -f "$PROJ_DIR/android/local.properties" ]; then
    sed -i '/^ndk.dir/d' "$PROJ_DIR/android/local.properties"
    echo "ndk.dir=$HOME/android-sdk/ndk/29.0.0" >> "$PROJ_DIR/android/local.properties"
    echo "📝 $PROJ_DIR/android/local.properties güncellendi"
fi

echo ""
echo "🎉 NDK hazır. Şimdi build alabilirsin:"
echo "   bash build-apk-termux.sh"
