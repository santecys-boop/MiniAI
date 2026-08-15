// AI Code Linter & JSX Auto-Fixer Engine for React SaaS Projects
import { ProjectFile } from "../types";

export interface LintReport {
  hasErrors: boolean;
  warnings: string[];
  autoFixedCount: number;
}

export function lintAndAutoFixReactFile(file: ProjectFile): { file: ProjectFile; report: LintReport } {
  let content = file.content;
  const warnings: string[] = [];
  let autoFixedCount = 0;

  if (!file.path.endsWith(".jsx") && !file.path.endsWith(".tsx") && !file.path.endsWith(".js") && !file.path.endsWith(".ts")) {
    return { file, report: { hasErrors: false, warnings, autoFixedCount: 0 } };
  }

  // 1. React hook'larının eksik importlarını kontrol et ve ekle
  const hooks = ["useState", "useEffect", "useRef", "useMemo", "useCallback", "useContext"];
  const usedHooks = hooks.filter(h => new RegExp(`\\b${h}\\s*\\(`, "g").test(content));

  if (usedHooks.length > 0 && !content.includes("from 'react'") && !content.includes('from "react"')) {
    content = `import React, { ${usedHooks.join(", ")} } from 'react';\n` + content;
    autoFixedCount++;
    warnings.push(`Eksik React hook importları (${usedHooks.join(", ")}) otomatik eklendi.`);
  }

  // 2. class -> className dönüşümü
  if (/\bclass="[^"]*"/g.test(content) && !content.includes("<!DOCTYPE")) {
    content = content.replace(/\bclass="([^"]*)"/g, 'className="$1"');
    autoFixedCount++;
    warnings.push("HTML 'class' nitelikleri React 'className' formatına dönüştürüldü.");
  }

  // 3. Lucide eksik importlarını kontrol et
  if (content.includes("<Lucide") || content.includes("<Home") || content.includes("<Settings") || content.includes("<Plus") || content.includes("<Trash")) {
    if (!content.includes("from 'lucide-react'") && !content.includes('from "lucide-react"')) {
      // Import yoksa generic icon helper ekle
    }
  }

  // 4. Default export kontrolü
  if (!content.includes("export default") && (file.path.includes("App.") || file.path.includes("pages/"))) {
    const mainFunc = content.match(/function\s+([A-Z]\w+)/);
    if (mainFunc) {
      content += `\n\nexport default ${mainFunc[1]};`;
      autoFixedCount++;
      warnings.push(`Eksik 'export default ${mainFunc[1]}' otomatik eklendi.`);
    }
  }

  return {
    file: {
      ...file,
      content
    },
    report: {
      hasErrors: false,
      warnings,
      autoFixedCount
    }
  };
}

export function lintAndFixProject(files: ProjectFile[]): { files: ProjectFile[]; totalFixes: number } {
  let totalFixes = 0;
  const fixedFiles = files.map(f => {
    const res = lintAndAutoFixReactFile(f);
    totalFixes += res.report.autoFixedCount;
    return res.file;
  });

  return { files: fixedFiles, totalFixes };
}
