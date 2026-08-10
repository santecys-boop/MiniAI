import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, RefreshCw, Copy, Check } from "lucide-react";

export default function AdminRapor() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Gizli şifre
  const ADMIN_PASSWORD = "ahmet2026";

  useEffect(() => {
    if (loggedIn) loadLogs();
  }, [loggedIn]);

  function loadLogs() {
    const data = localStorage.getItem('mini-logs');
    if (data) {
      const parsed = JSON.parse(data);
      setLogs(parsed.reverse());
    }
  }

  function copyAll() {
    const text = logs.map(l => `[${l.time}] ${l.type}: ${l.action}${l.details ? ' - ' + l.details : ''}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function clearLogs() {
    localStorage.removeItem('mini-logs');
    setLogs([]);
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#030308] flex items-center justify-center p-4">
        <Card className="w-full max-w-sm p-6 bg-white/5 border-white/10 text-white space-y-4">
          <h2 className="text-xl font-bold text-center">🔒 Admin Girişi</h2>
          <Input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && password === ADMIN_PASSWORD && setLoggedIn(true)}
            className="bg-white/5 border-white/10 text-white"
          />
          <Button 
            className="w-full"
            onClick={() => password === ADMIN_PASSWORD && setLoggedIn(true)}
          >
            Giriş
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030308] text-white p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold">📊 Raporlar</h1>
            <span className="text-sm text-white/40">({logs.length} kayıt)</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={loadLogs}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={copyAll}>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={clearLogs}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-h-[80vh] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-white/30 text-center py-8">Henüz rapor yok</p>
          ) : (
            logs.map((log: any, i: number) => (
              <div key={i} className={`p-3 rounded-xl text-xs font-mono ${
                log.type?.includes('HATA') || log.type?.includes('error') 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-300' 
                  : 'bg-white/[0.02] border border-white/5 text-white/60'
              }`}>
                <span className="text-white/30">[{log.time?.slice(11, 19)}]</span>{' '}
                <span className={log.type?.includes('HATA') ? 'text-red-400' : 'text-blue-400'}>
                  {log.type}
                </span>
                : {log.action}
                {log.details && <span className="text-white/30"> - {log.details.slice(0, 100)}</span>}
                {log.screen && <span className="text-white/20 ml-2">📱 {log.screen}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
