// Surgical Multi-File Patch & Diff Engine for Incremental SaaS Modifications
import { ProjectFile } from "../types";

export interface FileChange {
  path: string;
  action: "create" | "update" | "delete";
  content?: string;
  diff?: string;
}

export interface ProjectPatchResult {
  updatedFiles: ProjectFile[];
  changes: FileChange[];
  newSqlQueries: string[];
}

export function applyProjectPatches(
  currentFiles: ProjectFile[],
  incomingFiles: ProjectFile[],
  currentSql: string[] = [],
  incomingSql: string[] = []
): ProjectPatchResult {
  const fileMap = new Map<string, ProjectFile>();
  currentFiles.forEach(f => fileMap.set(f.path, { ...f }));

  const changes: FileChange[] = [];

  incomingFiles.forEach(newFile => {
    const existing = fileMap.get(newFile.path);
    if (!existing) {
      // Yeni dosya oluşturuldu
      fileMap.set(newFile.path, newFile);
      changes.push({
        path: newFile.path,
        action: "create",
        content: newFile.content
      });
    } else if (existing.content !== newFile.content) {
      // Mevcut dosya güncellendi
      fileMap.set(newFile.path, newFile);
      changes.push({
        path: newFile.path,
        action: "update",
        content: newFile.content
      });
    }
  });

  // SQL Sorgularını birleştir (tekrar edenleri filtrele)
  const combinedSql = [...currentSql];
  const newSqlQueries: string[] = [];

  incomingSql.forEach(q => {
    const normalized = q.trim();
    if (normalized && !combinedSql.includes(normalized)) {
      combinedSql.push(normalized);
      newSqlQueries.push(normalized);
    }
  });

  return {
    updatedFiles: Array.from(fileMap.values()),
    changes,
    newSqlQueries
  };
}

export function parseSurgicalDiffResponse(rawText: string): { files: ProjectFile[]; sqlQueries: string[] } {
  const files: ProjectFile[] = [];
  const sqlQueries: string[] = [];

  // [FILE:path]...[/FILE] blokları
  const fileRegex = /\[FILE:([^\]\n\r]+)\]\s*([\s\S]*?)(?=\[\/FILE\]|\[FILE:|$)/gi;
  let match;
  while ((match = fileRegex.exec(rawText)) !== null) {
    let content = match[2].trim();
    content = content.replace(/\[\/FILE\]/gi, "").trim();
    content = content.replace(/^```[\w]*\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const path = match[1].trim();
    if (path && content) {
      files.push({
        path,
        content,
        lang: path.endsWith(".sql") ? "sql" : path.endsWith(".jsx") || path.endsWith(".tsx") ? "tsx" : "javascript"
      });
    }
  }

  // [SQL]...[/SQL] blokları
  const sqlRegex = /\[SQL\]\s*([\s\S]*?)(?=\[\/SQL\]|\[SQL\]|$)/gi;
  while ((match = sqlRegex.exec(rawText)) !== null) {
    const query = match[1].replace(/\[\/SQL\]/gi, "").trim();
    if (query) sqlQueries.push(query);
  }

  return { files, sqlQueries };
}
