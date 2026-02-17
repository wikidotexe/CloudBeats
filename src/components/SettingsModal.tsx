import { useState, useEffect } from "react";
import { getStoredConfig, saveConfig, ping, SubsonicConfig } from "../services/subsonicApi";
import { X, CheckCircle, XCircle, Loader2, Music, Sliders } from "lucide-react";
import { usePlayer, EQ_FREQUENCIES, EQ_PRESETS } from "../contexts/PlayerContext";
import { Slider } from "./ui/slider";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export default function SettingsModal({ open, onClose, onConnected }: SettingsModalProps) {
  const {
    eqEnabled,
    eqPreset,
    eqGains,
    toggleEq,
    setEqPreset,
    setEqGain
  } = usePlayer();

  const [server, setServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"server" | "equalizer">("server");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <div className="glass-panel rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10 p-1 hover:bg-secondary rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("server")}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === "server" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Server Settings
          </button>
          <button
            onClick={() => setActiveTab("equalizer")}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === "equalizer" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Equalizer
          </button>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-thin">
          {activeTab === "server" ? (
            <div className="space-y-4">
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
                  <div className="flex items-center gap-2 text-sm text-primary animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-4 h-4" /> Connected successfully!
                  </div>
                )}
                {status === "error" && (
                  <div className="flex items-center gap-2 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                    <XCircle className="w-4 h-4" /> Connection failed. Check your settings.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">Equalizer</h3>
                  <p className="text-sm text-muted-foreground">Enhance your audio experience</p>
                </div>
                <button
                  onClick={toggleEq}
                  className={`w-12 h-6 rounded-full transition-colors relative ${eqEnabled ? "bg-primary" : "bg-secondary"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${eqEnabled ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className={`space-y-6 transition-opacity duration-200 ${eqEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {Object.keys(EQ_PRESETS).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setEqPreset(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${eqPreset === preset
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                        }`}
                    >
                      {preset}
                    </button>
                  ))}
                  <button
                    onClick={() => setEqPreset("custom")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${eqPreset === "custom"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                      }`}
                  >
                    Custom
                  </button>
                </div>

                <div className="flex items-end justify-between h-48 bg-secondary/30 rounded-xl p-4 gap-2">
                  {EQ_FREQUENCIES.map((freq, i) => (
                    <div key={freq} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="relative h-32 w-full flex justify-center">
                        <Slider
                          orientation="vertical"
                          min={-12}
                          max={12}
                          step={1}
                          value={[eqGains[i]]}
                          onValueChange={([val]) => setEqGain(i, val)}
                          className="h-full"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium rotate-45 sm:rotate-0 mt-2">
                        {freq >= 1000 ? `${freq / 1000}k` : freq}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
