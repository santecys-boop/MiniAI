import type { Plugin } from "vite";
import JSZip from "jszip";
import { promises as fs } from "node:fs";
import path from "node:path";

const INCLUDE_DIRS = ["src", "supabase", "public", "scripts"];
const INCLUDE_FILES = [
  "package.json", "bun.lock", "index.html", "vite.config.ts",
  "tailwind.config.ts", "postcss.config.js", "tsconfig.json",
  "tsconfig.app.json", "tsconfig.node.json", "components.json",
  "eslint.config.js", "README.md", "vitest.config.ts",
  ".env", ".env.local", ".env.example", ".gitignore",
];
const EXCLUDE = new Set(["node_modules", "dist", ".git", ".lovable", ".cache"]);
const OUTPUT_ZIPS = new Set(["mini-source.zip", "mini-web-apk.zip", "mini-native-apk.zip"]);

const APP_ID = "app.lovable.f43b86e5ccf34666bec224f17bb41697";
const APP_NAME = "Mini";
const LIVE_URL = "https://ai-site-craft-16.lovable.app";

const CAPACITOR_WEB = `import type { CapacitorConfig } from '@capacitor/cli';

// HOT-RELOAD MODU: APK açıldığında canlı siteden yüklenir.
// Sitede değişiklik yaparsan APK'yı yeniden kurmana gerek YOK.
const config: CapacitorConfig = {
  appId: '${APP_ID}',
  appName: '${APP_NAME}',
  webDir: 'dist',
  server: {
    url: '${LIVE_URL}',
    cleartext: true,
    androidScheme: 'https',
  },
};

export default config;
`;

const CAPACITOR_NATIVE = `import type { CapacitorConfig } from '@capacitor/cli';

// GERÇEK NATIVE MODU: Kod APK'nın içine gömülür, offline çalışır.
// Güncelleme için: kodu değiştir -> npm run build -> npx cap sync -> yeniden APK build.
const config: CapacitorConfig = {
  appId: '${APP_ID}',
  appName: '${APP_NAME}',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
};

export default config;
`;

const TERMUX_WEB_MD = `# Mini — Hot-Reload APK (Termux Build)

Bu APK sadece bir "kabuk"tur. Açıldığında ${LIVE_URL} adresini yükler.
Lovable'da site değişince APK'yı YENİDEN KURMANA GEREK YOK — sadece uygulamayı kapat aç.

## Termux'ta gerekli paketler (bir kere)

\`\`\`bash
pkg update && pkg upgrade -y
pkg install -y nodejs-lts openjdk-17 gradle git wget unzip which
\`\`\`

## Android SDK (Termux için)

Termux'ta Android SDK cmdline-tools kur:

\`\`\`bash
mkdir -p ~/android-sdk/cmdline-tools && cd ~/android-sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmd.zip
unzip cmd.zip && mv cmdline-tools latest && rm cmd.zip
export ANDROID_HOME=~/android-sdk
export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
\`\`\`

Bu değişkenleri kalıcı yap:
\`\`\`bash
echo 'export ANDROID_HOME=~/android-sdk' >> ~/.bashrc
echo 'export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/build-tools/34.0.0' >> ~/.bashrc
source ~/.bashrc
\`\`\`

## Build

\`\`\`bash
unzip mini-web-apk.zip -d mini-web && cd mini-web
npm install
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
\`\`\`

APK burada olur:
\`android/app/build/outputs/apk/debug/app-debug.apk\`

## Kur

\`\`\`bash
cp android/app/build/outputs/apk/debug/app-debug.apk ~/storage/downloads/mini.apk
\`\`\`
Sonra dosya yöneticisinden mini.apk'a tıkla, kur.

## Güncelleme

APK'yı bir kere kurdun. Sitede değişiklik yapınca APK'yı YENİDEN BUILD ETMENE GEREK YOK.
Sadece uygulamayı kapatıp aç — canlı siteyi çeker.
`;

const TERMUX_NATIVE_MD = `# Mini — Gerçek Native APK (Termux Build)

Bu APK kodu içine gömer. Offline çalışır, internet yokken de açılır (backend istekleri hariç).
Güncelleme için APK'yı YENİDEN build edip kurman gerekir.

## Termux'ta gerekli paketler (bir kere)

\`\`\`bash
pkg update && pkg upgrade -y
pkg install -y nodejs-lts openjdk-17 gradle git wget unzip which
\`\`\`

## Android SDK (Termux için)

\`\`\`bash
mkdir -p ~/android-sdk/cmdline-tools && cd ~/android-sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmd.zip
unzip cmd.zip && mv cmdline-tools latest && rm cmd.zip
export ANDROID_HOME=~/android-sdk
export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
\`\`\`

Kalıcı yap:
\`\`\`bash
echo 'export ANDROID_HOME=~/android-sdk' >> ~/.bashrc
echo 'export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/build-tools/34.0.0' >> ~/.bashrc
source ~/.bashrc
\`\`\`

## Build

\`\`\`bash
unzip mini-native-apk.zip -d mini-native && cd mini-native
npm install
npm run build            # dist/ üretir
npx cap add android
npx cap sync android     # dist/'i android'e kopyalar
cd android
./gradlew assembleDebug
\`\`\`

APK burada:
\`android/app/build/outputs/apk/debug/app-debug.apk\`

## Kur

\`\`\`bash
cp android/app/build/outputs/apk/debug/app-debug.apk ~/storage/downloads/mini.apk
\`\`\`
Dosya yöneticisinden mini.apk'a tıkla, kur.

## Güncelleme (ÖNEMLİ)

Kodda değişiklik yapınca:
\`\`\`bash
cd mini-native
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
\`\`\`
Yeni APK'yı tekrar kur (üstüne yazacak).
`;

async function addDir(zip: JSZip, absDir: string, relDir: string) {
  let entries: string[];
  try { entries = await fs.readdir(absDir); } catch { return; }
  for (const name of entries) {
    if (EXCLUDE.has(name)) continue;
    if (OUTPUT_ZIPS.has(name)) continue;
    const abs = path.join(absDir, name);
    const rel = path.posix.join(relDir, name);
    const stat = await fs.stat(abs);
    if (stat.isDirectory()) await addDir(zip, abs, rel);
    else if (stat.isFile() && stat.size < 2 * 1024 * 1024) {
      zip.file(rel, await fs.readFile(abs));
    }
  }
}

function addCapacitorDeps(pkgJsonStr: string): string {
  try {
    const pkg = JSON.parse(pkgJsonStr);
    pkg.dependencies = pkg.dependencies || {};
    pkg.devDependencies = pkg.devDependencies || {};
    pkg.dependencies["@capacitor/core"] = "^6.1.2";
    pkg.dependencies["@capacitor/android"] = "^6.1.2";
    pkg.devDependencies["@capacitor/cli"] = "^6.1.2";
    return JSON.stringify(pkg, null, 2);
  } catch {
    return pkgJsonStr;
  }
}

async function buildBaseZip(root: string): Promise<JSZip> {
  const zip = new JSZip();
  for (const d of INCLUDE_DIRS) {
    await addDir(zip, path.join(root, d), d);
  }
  for (const f of INCLUDE_FILES) {
    try {
      const abs = path.join(root, f);
      const stat = await fs.stat(abs);
      if (stat.isFile()) zip.file(f, await fs.readFile(abs));
    } catch { /* skip */ }
  }
  return zip;
}

async function writeZip(zip: JSZip, outPath: string) {
  const buf = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  await fs.writeFile(outPath, buf);
}

async function buildAllZips(root: string) {
  const outDir = path.join(root, "public");
  await fs.mkdir(outDir, { recursive: true });

  // 1) Plain source zip (site kodu, capacitor yok)
  const baseSrc = await buildBaseZip(root);
  await writeZip(baseSrc, path.join(outDir, "mini-source.zip"));

  // Grab package.json once for capacitor variants
  const pkgJsonPath = path.join(root, "package.json");
  const originalPkg = await fs.readFile(pkgJsonPath, "utf8").catch(() => "{}");
  const pkgWithCap = addCapacitorDeps(originalPkg);

  // 2) Hot-reload APK zip (siteye bağlanan)
  const webZip = await buildBaseZip(root);
  webZip.file("package.json", pkgWithCap);
  webZip.file("capacitor.config.ts", CAPACITOR_WEB);
  webZip.file("BUILD-TERMUX.md", TERMUX_WEB_MD);
  webZip.file("README-APK.md", "Bu paket HOT-RELOAD APK üretir. Detay: BUILD-TERMUX.md\n");
  await writeZip(webZip, path.join(outDir, "mini-web-apk.zip"));

  // 3) Gerçek native APK zip (kod içeride)
  const nativeZip = await buildBaseZip(root);
  nativeZip.file("package.json", pkgWithCap);
  nativeZip.file("capacitor.config.ts", CAPACITOR_NATIVE);
  nativeZip.file("BUILD-TERMUX.md", TERMUX_NATIVE_MD);
  nativeZip.file("README-APK.md", "Bu paket OFFLINE NATIVE APK üretir. Detay: BUILD-TERMUX.md\n");
  await writeZip(nativeZip, path.join(outDir, "mini-native-apk.zip"));
}

export function zipSourcePlugin(): Plugin {
  const root = process.cwd();
  return {
    name: "mini-zip-source",
    apply: () => true,
    async buildStart() {
      try { await buildAllZips(root); } catch (e) { console.warn("[zip-source] failed:", e); }
    },
    configureServer() {
      buildAllZips(root).catch(() => {});
    },
  };
}
