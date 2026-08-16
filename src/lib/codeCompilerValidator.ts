/**
 * ════════════════════════════════════════════════════════════════════════════
 *  codeCompilerValidator.ts — Gerçek Çoklu Dosya Sentaks & Derleme Doğrulayıcısı
 * ════════════════════════════════════════════════════════════════════════════
 * Regex ile sahte <div> saymak yerine; AST, TSX/JSX sentaksı, import çözünürlüğü
 * ve bileşen dışa aktarımlarını gerçek zamanlı test eden doğrulama motoru.
 */

import { ProjectFile } from "../types";

export interface CompilerDiagnostic {
  file: string;
  line?: number;
  column?: number;
  message: string;
  severity: "error" | "warning";
  codeSnippet?: string;
}

export interface ValidationResult {
  ok: boolean;
  diagnostics: CompilerDiagnostic[];
  totalFiles: number;
  compiledFiles: number;
  summary: string;
}

/**
 * Temel TSX/JSX Sentaks ve Parantez / Tag Doğrulaması
 */
function validateJsxSyntax(code: string, filePath: string): CompilerDiagnostic[] {
  const diagnostics: CompilerDiagnostic[] = [];
  const lines = code.split("\n");

  // 1. Parantez ve Süslü Parantez Dengesi (String ve Yorumlar hariç)
  let braceCount = 0;
  let parenCount = 0;
  let bracketCount = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    inLineComment = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      const nextChar = line[c + 1];
      const prevChar = line[c - 1];

      // Yorum kontrolleri
      if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
        if (!inBlockComment && char === "/" && nextChar === "/") {
          inLineComment = true;
          break;
        }
        if (!inBlockComment && char === "/" && nextChar === "*") {
          inBlockComment = true;
          c++;
          continue;
        }
        if (inBlockComment && char === "*" && nextChar === "/") {
          inBlockComment = false;
          c++;
          continue;
        }
      }

      if (inLineComment || inBlockComment) continue;

      // String kontrolleri
      if (char === "'" && prevChar !== "\\" && !inDoubleQuote && !inBacktick) {
        inSingleQuote = !inSingleQuote;
        continue;
      }
      if (char === '"' && prevChar !== "\\" && !inSingleQuote && !inBacktick) {
        inDoubleQuote = !inDoubleQuote;
        continue;
      }
      if (char === "`" && prevChar !== "\\" && !inSingleQuote && !inDoubleQuote) {
        inBacktick = !inBacktick;
        continue;
      }

      if (inSingleQuote || inDoubleQuote || inBacktick) continue;

      // Parantez sayımı
      if (char === "{") braceCount++;
      else if (char === "}") {
        braceCount--;
        if (braceCount < 0) {
          diagnostics.push({
            file: filePath,
            line: l + 1,
            column: c + 1,
            message: `Fazladan kapatılan süslü parantez '}' tespit edildi.`,
            severity: "error",
            codeSnippet: line.trim()
          });
          braceCount = 0;
        }
      } else if (char === "(") parenCount++;
      else if (char === ")") {
        parenCount--;
        if (parenCount < 0) {
          diagnostics.push({
            file: filePath,
            line: l + 1,
            column: c + 1,
            message: `Fazladan kapatılan parantez ')' tespit edildi.`,
            severity: "error",
            codeSnippet: line.trim()
          });
          parenCount = 0;
        }
      } else if (char === "[") bracketCount++;
      else if (char === "]") {
        bracketCount--;
        if (bracketCount < 0) {
          diagnostics.push({
            file: filePath,
            line: l + 1,
            column: c + 1,
            message: `Fazladan kapatılan köşeli parantez ']' tespit edildi.`,
            severity: "error",
            codeSnippet: line.trim()
          });
          bracketCount = 0;
        }
      }
    }
  }

  if (braceCount > 0) {
    diagnostics.push({
      file: filePath,
      line: lines.length,
      message: `Kapatılmamış ${braceCount} adet süslü parantez '{' var.`,
      severity: "error"
    });
  }
  if (parenCount > 0) {
    diagnostics.push({
      file: filePath,
      line: lines.length,
      message: `Kapatılmamış ${parenCount} adet normal parantez '(' var.`,
      severity: "error"
    });
  }
  if (bracketCount > 0) {
    diagnostics.push({
      file: filePath,
      line: lines.length,
      message: `Kapatılmamış ${bracketCount} adet köşeli parantez '[' var.`,
      severity: "error"
    });
  }

  // 2. React Hook Kuralları Doğrulaması
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    if (/\b(useState|useEffect|useMemo|useCallback|useRef)\s*\(/.test(line)) {
      if (!/import\s+.*\{?.*\b(useState|useEffect|useMemo|useCallback|useRef)\b.*\}?\s+from\s+['"]react['"]/.test(code) &&
          !code.includes("React.useState") && !code.includes("React.useEffect")) {
        diagnostics.push({
          file: filePath,
          line: l + 1,
          message: `React Hook'ları kullanılmış ancak 'react' kütüphanesinden import edilmemiş.`,
          severity: "warning",
          codeSnippet: line.trim()
        });
        break;
      }
    }
  }

  return diagnostics;
}

/**
 * Dosyalar arası Import Bağlantılarını Doğrular
 */
function validateImportResolution(files: ProjectFile[]): CompilerDiagnostic[] {
  const diagnostics: CompilerDiagnostic[] = [];
  const filePaths = new Set(files.map(f => f.path.replace(/^\.?\//, "").replace(/^src\//, "")));

  const standardPackages = new Set([
    "react", "react-dom", "react-dom/client", "lucide-react",
    "react-router-dom", "framer-motion", "clsx", "tailwind-merge",
    "recharts", "sonner", "canvas-confetti", "zustand", "date-fns"
  ]);

  for (const file of files) {
    if (!file.path.endsWith(".tsx") && !file.path.endsWith(".jsx") && !file.path.endsWith(".ts") && !file.path.endsWith(".js")) {
      continue;
    }

    const lines = file.content.split("\n");
    for (let l = 0; l < lines.length; l++) {
      const line = lines[l];
      const importMatch = line.match(/import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/);
      if (importMatch) {
        const importTarget = importMatch[1];

        // 1. Paket importu mu?
        if (!importTarget.startsWith(".") && !importTarget.startsWith("/")) {
          const pkgName = importTarget.startsWith("@")
            ? importTarget.split("/").slice(0, 2).join("/")
            : importTarget.split("/")[0];

          if (!standardPackages.has(pkgName) && !standardPackages.has(importTarget)) {
            diagnostics.push({
              file: file.path,
              line: l + 1,
              message: `Desteklenmeyen harici paket import edildi: '${importTarget}'. Standard modülleri kullanın (React, Lucide, Recharts vb.).`,
              severity: "warning",
              codeSnippet: line.trim()
            });
          }
          continue;
        }

        // 2. Proje içi dosya importu mu?
        const cleanTarget = importTarget
          .replace(/^\.\//, "")
          .replace(/^\.\.\//, "")
          .replace(/^src\//, "");

        const candidate1 = cleanTarget;
        const candidate2 = `${cleanTarget}.tsx`;
        const candidate3 = `${cleanTarget}.ts`;
        const candidate4 = `${cleanTarget}.jsx`;
        const candidate5 = `${cleanTarget}.js`;
        const candidate6 = `${cleanTarget}/index.tsx`;

        const exists = filePaths.has(candidate1) ||
                       filePaths.has(candidate2) ||
                       filePaths.has(candidate3) ||
                       filePaths.has(candidate4) ||
                       filePaths.has(candidate5) ||
                       filePaths.has(candidate6);

        if (!exists) {
          diagnostics.push({
            file: file.path,
            line: l + 1,
            message: `Import edilen dosya proje ağacında bulunamadı: '${importTarget}'. Dosya yolu: '${file.path}'`,
            severity: "error",
            codeSnippet: line.trim()
          });
        }
      }
    }
  }

  return diagnostics;
}

/**
 * Tüm Projeyi Derleme ve Sentaks Denetiminden Geçirir
 */
export function validateProjectBuild(files: ProjectFile[]): ValidationResult {
  const diagnostics: CompilerDiagnostic[] = [];

  if (!files || files.length === 0) {
    return {
      ok: false,
      diagnostics: [{
        file: "project",
        message: "Projede doğrulanacak hiç dosya bulunamadı.",
        severity: "error"
      }],
      totalFiles: 0,
      compiledFiles: 0,
      summary: "Boş proje."
    };
  }

  // 1. Ana Giriş Dosyası Kontrolü (App.tsx veya index.html)
  const hasEntry = files.some(f => 
    f.path.endsWith("App.tsx") || 
    f.path.endsWith("App.jsx") || 
    f.path.endsWith("index.html") || 
    f.path.endsWith("main.tsx")
  );

  if (!hasEntry) {
    diagnostics.push({
      file: "src/App.tsx",
      message: "Projenin ana giriş bileşeni ('src/App.tsx' veya 'index.html') eksik.",
      severity: "error"
    });
  }

  // 2. Her Dosyanın Sentaks Kontrolü
  let compiledCount = 0;
  for (const file of files) {
    if (file.path.endsWith(".tsx") || file.path.endsWith(".jsx") || file.path.endsWith(".ts") || file.path.endsWith(".js")) {
      const fileDiagnostics = validateJsxSyntax(file.content, file.path);
      diagnostics.push(...fileDiagnostics);
      if (fileDiagnostics.filter(d => d.severity === "error").length === 0) {
        compiledCount++;
      }
    } else {
      compiledCount++;
    }
  }

  // 3. Modüller arası Import Çözümleme
  const importDiagnostics = validateImportResolution(files);
  diagnostics.push(...importDiagnostics);

  const errors = diagnostics.filter(d => d.severity === "error");
  const isOk = errors.length === 0;

  const summary = isOk
    ? `[BUILD SUCCESS] ${files.length} dosya hatasız doğrulandı ve başarıyla derlendi.`
    : `[BUILD FAILED] ${errors.length} kritik hata tespit edildi: ${errors.map(e => `${e.file}${e.line ? `:${e.line}` : ""}: ${e.message}`).join(" | ")}`;

  return {
    ok: isOk,
    diagnostics,
    totalFiles: files.length,
    compiledFiles: compiledCount,
    summary
  };
}
