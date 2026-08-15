// Multi-File SaaS Project Version History & Rollback Checkpoint Engine
import { ProjectFile } from "../types";

export interface ProjectVersion {
  id: string;
  versionNumber: number;
  timestamp: string;
  promptSummary: string;
  files: ProjectFile[];
  sqlQueries: string[];
}

const STORAGE_KEY_PREFIX = "mini_saas_versions_";

export function saveProjectVersion(
  projectId: string,
  promptSummary: string,
  files: ProjectFile[],
  sqlQueries: string[] = []
): ProjectVersion {
  const versions = getProjectVersions(projectId);
  const nextNum = versions.length + 1;

  const newVersion: ProjectVersion = {
    id: `v_${projectId}_${nextNum}_${Date.now().toString(36)}`,
    versionNumber: nextNum,
    timestamp: new Date().toISOString(),
    promptSummary: promptSummary.slice(0, 80),
    files: JSON.parse(JSON.stringify(files)),
    sqlQueries: [...sqlQueries]
  };

  versions.push(newVersion);
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + projectId, JSON.stringify(versions.slice(-20))); // son 20 versiyonu sakla
  } catch (_) {
    // quota aşımı durumunda eski versiyonları temizle
    localStorage.setItem(STORAGE_KEY_PREFIX + projectId, JSON.stringify(versions.slice(-5)));
  }

  return newVersion;
}

export function getProjectVersions(projectId: string): ProjectVersion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + projectId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getVersionById(projectId: string, versionId: string): ProjectVersion | undefined {
  const versions = getProjectVersions(projectId);
  return versions.find(v => v.id === versionId);
}

export function clearProjectVersions(projectId: string): void {
  localStorage.removeItem(STORAGE_KEY_PREFIX + projectId);
}
