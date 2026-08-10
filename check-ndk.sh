#!/data/data/com.termux/files/usr/bin/bash
set -e

NDK_DIR="$(grep '^ndk.dir' android/local.properties 2>/dev/null | sed 's/ndk.dir=//' | tr -d '\r')"

if [ -z "$NDK_DIR" ]; then
    NDK_DIR="$HOME/android-sdk/ndk/29.0.0"
fi

CLANG="$NDK_DIR/toolchains/llvm/prebuilt/linux-aarch64/bin/clang"
CLANGPP="$NDK_DIR/toolchains/llvm/prebuilt/linux-aarch64/bin/clang++"

echo "🔍 NDK kontrol ediliyor: $NDK_DIR"
echo ""

if [ ! -d "$NDK_DIR" ]; then
    echo "❌ NDK dizini bulunamadı: $NDK_DIR"
    echo "   Çalıştır: bash install-ndk-termux.sh"
    exit 1
fi

if [ ! -f "$CLANG" ]; then
    echo "❌ NDK içinde ARM64 derleyici yok: $CLANG"
    echo "   Muhtemelen Google'ın resmi NDK r25 kullanıyorsun. Termux için ARM64 NDK kurulmalı."
    echo "   Çalıştır: bash install-ndk-termux.sh"
    exit 1
fi

if [ ! -f "$CLANGPP" ]; then
    echo "❌ C++ derleyici eksik: $CLANGPP"
    exit 1
fi

echo "✅ NDK ve ARM64 derleyiciler doğru:"
echo "   $CLANG"
echo "   $CLANGPP"
