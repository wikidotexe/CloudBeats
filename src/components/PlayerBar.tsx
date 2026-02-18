import { usePlayer } from "../contexts/PlayerContext";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Repeat1 } from "lucide-react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Marquee } from "./Marquee";

function formatTime(sec: number) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerBar() {
  const {
    currentSong, isPlaying, currentTime, duration, volume,
    togglePlay, next, previous, seek, setVolume, setNowPlayingOpen,
    coverUrl, isShuffle, repeatMode, toggleShuffle, toggleRepeat
  } = usePlayer();

  if (!currentSong) {
    return (
      <footer className="h-20 bg-player border-t border-border flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No song playing</p>
      </footer>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const coverSrc = coverUrl(currentSong.coverArt);

  return (
    <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-40">
      <div className="bg-background/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] px-4 py-2 sm:px-6 sm:py-3 flex items-center gap-4 sm:gap-6 h-20 sm:h-24 transition-all duration-300 hover:bg-background/70">
        {/* Song info */}
        <div
          className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 cursor-pointer group/info"
          onClick={() => setNowPlayingOpen(true)}
        >
          <motion.div layoutId="album-art" className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl shadow-lg flex-shrink-0 overflow-hidden ring-1 ring-white/10">
            {coverSrc ? (
              <img src={coverSrc} alt="" className="w-full h-full object-cover group-hover/info:scale-110 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center group-hover/info:bg-secondary/80 transition-colors">
                <span className="text-muted-foreground text-xl sm:text-2xl">♪</span>
              </div>
            )}
          </motion.div>
          <div className="min-w-0 flex-1">
            <Marquee
              text={currentSong.title}
              className="text-sm sm:text-base font-bold text-foreground group-hover/info:text-primary transition-colors leading-tight"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground/80 font-medium truncate mt-0.5">{currentSong.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-[1.5] flex flex-col items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-2 sm:gap-6">
            <motion.button
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleShuffle}
              className={`transition-all p-2 rounded-full hover:bg-white/5 ${isShuffle ? "text-primary glow-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.2, x: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={previous}
              className="text-muted-foreground hover:text-foreground transition-all p-2 rounded-full hover:bg-white/5"
            >
              <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={togglePlay}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] transition-all duration-300"
            >
              {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-1" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.2, x: 2 }}
              whileTap={{ scale: 0.9 }}
              onClick={next}
              className="text-muted-foreground hover:text-foreground transition-all p-2 rounded-full hover:bg-white/5"
            >
              <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleRepeat}
              className={`transition-all p-2 rounded-full hover:bg-white/5 ${repeatMode !== "none" ? "text-primary glow-primary" : "text-muted-foreground hover:text-foreground"}`}
              title={repeatMode === "none" ? "Enable Repeat" : repeatMode === "all" ? "Repeat One" : "Disable Repeat"}
            >
              {repeatMode === "one" ? <Repeat1 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />}
            </motion.button>
          </div>

          <div className="w-full hidden sm:flex items-center gap-3 px-2">
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground w-10 text-right tabular-nums tracking-tighter">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={(vals) => seek(vals[0])}
              className="flex-1"
            />
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground w-10 tabular-nums tracking-tighter">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center justify-end flex-1 group/volume pr-2">
          <div className="flex items-center gap-3 w-32 bg-white/5 px-3 py-2 rounded-2xl transition-all hover:bg-white/10 ring-1 ring-white/5">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </motion.button>
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={(vals) => setVolume(vals[0])}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </footer>

  );
}
