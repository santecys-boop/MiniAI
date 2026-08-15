export type Role = "user" | "assistant";

export type ProjectFile = {
  path: string;
  content: string;
  lang: string;
};

export type Attachment = {
  kind: "image" | "file";
  name: string;
  data: string;
};

export type AutoEvent = {
  type: string;
  [k: string]: any;
};

export type Msg = {
  role: Role;
  chat?: string;
  plan?: string;
  code?: string;
  codeType?: "html" | "react" | string;
  attachments?: Attachment[];
  autoEvents?: AutoEvent[];
  autoUrl?: string;
  downloadName?: string;
  agentCandidates?: { idx: number; name: string; model: string; text: string; confidence?: number }[];
  isE2B?: boolean;
  e2bOutput?: string;
  compileStatus?: "starting" | "running" | "success";
  compileOutput?: string;
  buildArtifactUrl?: string;
  buildArtifactName?: string;
  isCompiling?: boolean;
  linuxCommands?: string[];
  appVisionScan?: string;
  appVisionData?: { appName: string; elementsCount: number; domStructure: string; bypassMode: string };
  projectFiles?: ProjectFile[];
  projectApiKey?: string;
  projectName?: string;
  architecturePlan?: string;
  databaseQueries?: string[];
  effort?: "Low" | "Medium" | "Max Effort" | string;
};

export type LogEntry = {
  id: string;
  time: string;
  type: "info" | "success" | "error" | "ai";
  text: string;
};

export type SiteRow = {
  id: string;
  prompt: string;
  code: string;
  type: string;
  model: string;
  published_url: string | null;
  screenshot_url: string | null;
  created_at: string;
  user_id?: string | null;
  projectName?: string;
  architecturePlan?: string;
  databaseQueries?: string[];
  projectFiles?: ProjectFile[];
};

export type ApiKeyRow = {
  id: string;
  label: string;
  provider: string;
  key_prefix: string;
  masked_key: string;
  active: boolean;
  last_used_at: string | null;
  created_at: string;
};

export type OnboardAnswers = {
  name: string;
  goal: string;
  style: string;
};
