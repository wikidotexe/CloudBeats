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
    <footer className="h-20 bg-player border-t border-border flex items-center px-4 gap-2 sm:gap-4">
      {/* Song info */}
      <div
        className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer group/info"
        onClick={() => setNowPlayingOpen(true)}
      >
        <motion.div layoutId="album-art" className="w-10 h-10 sm:w-12 sm:h-12 rounded-md flex-shrink-0 overflow-hidden">
          {coverSrc ? (
            <img src={coverSrc} alt="" className="w-full h-full object-cover group-hover/info:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full rounded-md bg-secondary flex items-center justify-center group-hover/info:bg-secondary/80 transition-colors">
              <span className="text-muted-foreground text-base sm:text-lg">♪</span>
            </div>
          )}
        </motion.div>
        <div className="min-w-0">
          <Marquee
            text={currentSong.title}
            className="text-xs sm:text-sm font-medium text-foreground group-hover/info:text-primary transition-colors"
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{currentSong.artist}</p>
        </div>
      </div>


      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-xl mx-auto">

        <div className="flex items-center gap-3 sm:gap-4">
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleShuffle}
            className={`transition-colors p-1 ${isShuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.2, color: "var(--foreground)" }}
            whileTap={{ scale: 0.9 }}
            onClick={previous}
            className="text-muted-foreground transition-colors p-1"
          >
            <SkipBack className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={togglePlay}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform glow-primary"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.2, color: "var(--foreground)" }}
            whileTap={{ scale: 0.9 }}
            onClick={next}
            className="text-muted-foreground transition-colors p-1"
          >
            <SkipForward className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleRepeat}
            className={`transition-colors p-1 ${repeatMode !== "none" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title={repeatMode === "none" ? "Enable Repeat" : repeatMode === "all" ? "Repeat One" : "Disable Repeat"}
          >
            {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </motion.button>
        </div>

        <div className="w-full hidden sm:flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={(vals) => seek(vals[0])}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground w-10 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="hidden sm:flex items-center justify-end gap-2 flex-1 group/volume">

        <div className="flex items-center gap-2 w-32">
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



    </footer>

  );
}
