import { useState, useEffect } from "react";
import { getStoredConfig, saveConfig, ping, SubsonicConfig } from "../services/subsonicApi";
import { X, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export default function SettingsModal({ open, onClose, onConnected }: SettingsModalProps) {
  const [server, setServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    const cfg = getStoredConfig();
    if (cfg) {
      setServer(cfg.server);
      setUsername(cfg.username);
      setPassword(cfg.password);
    }
  }, [open]);

  const handleTest = async () => {
    setTesting(true);
    setStatus("idle");
    const config: SubsonicConfig = { server, username, password };
    saveConfig(config);
    const ok = await ping();
    setStatus(ok ? "success" : "error");
    setTesting(false);
    if (ok) {
      onConnected();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel rounded-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-display text-xl font-bold text-foreground mb-1">Server Settings</h3>
        <p className="text-sm text-muted-foreground mb-6">Connect to your Nextcloud Music (Subsonic API)</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Server URL</label>
            <input
              type="url"
              placeholder="https://cloud.example.com/apps/music/subsonic"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">API Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Generate an API password from Nextcloud Music settings
            </p>
          </div>

          <button
            onClick={handleTest}
            disabled={testing || !server || !username || !password}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {testing ? "Connecting..." : "Connect & Test"}
          </button>

          {status === "success" && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle className="w-4 h-4" /> Connected successfully!
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="w-4 h-4" /> Connection failed. Check your settings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
