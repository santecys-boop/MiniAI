import { registerPlugin } from '@capacitor/core';

export interface ExecResult { output: string; exitCode: number; }
export interface ToolsInfo { busybox: boolean; proot: boolean; rootfs: string; }

export interface TerminalPlugin {
  exec(options: { command: string }): Promise<{ value: ExecResult }>;
  getTools(): Promise<{ value: ToolsInfo }>;
}

const Terminal = registerPlugin<TerminalPlugin>('Terminal');
export default Terminal;
