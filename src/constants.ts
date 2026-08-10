import { CLAUDE_PROMPT } from "./lib/claudePrompt";

export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '930467842733-agt5u1agvpfvsg56mr844om9qa19ku01.apps.googleusercontent.com';

export const IBAN_NO = "TR37 0001 0015 5292 9714 5450 01";
export const IBAN_HOLDER = "Mini AI";

export const ONLINE_COMPILER_API_KEY = "54a81b482603efeb0fdbf7ce5784e330";
export const ADMIN_HASH = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";

export const MODEL_OPTIONS = [
  { v: "sambanova", label: "Mini-Pro 3" },
  { v: "lovable", label: "Mini-Flash 2" },
  { v: "gemini", label: "Mini-Vision 1" },
  { v: "openrouter", label: "Mini-Coder X" },
];

export const ONBOARDING_KEY = "mini_onboarded_v1";

export const AI_SYSTEM_PROMPT = CLAUDE_PROMPT;

export const AI_BRIDGE_SCRIPT = `
<script>
// === Mini AI Bridge — Uygulamadan Yapay Zeka Çağırma Köprüsü ===
window.askAI = function(prompt) {
  return new Promise(function(resolve) {
    var id = 'ai_' + Math.random().toString(36).slice(2);
    function handler(e) {
      if (e.data && e.data.type === 'ai-response' && e.data.id === id) {
        window.removeEventListener('message', handler);
        resolve(e.data.text);
      }
    }
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: 'ai-request', id: id, prompt: prompt }, '*');
  });
};
window.showAILoading = function(el) { if(el) el.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:12px;color:#888"><svg width="20" height="20" viewBox="0 0 24 24" style="animation:spin 1s linear infinite"><style>@keyframes spin{to{transform:rotate(360deg)}}</style><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-linecap="round"/></svg> Yapay zeka düşünüyor...</div>'; };
console.log('[Mini AI Bridge] Yapay zeka köprüsü aktif — askAI() kullanıma hazır.');
<\/script>
`;
