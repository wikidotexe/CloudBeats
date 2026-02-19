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
  const { currentSong, isPlaying, currentTime, duration, volume, togglePlay, next, previous, seek, setVolume, setNowPlayingOpen, coverUrl, isShuffle, repeatMode, toggleShuffle, toggleRepeat } = usePlayer();

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
    <footer className="fixed bottom-3 left-0 right-0 z-40 flex justify-center md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[90%] md:max-w-4xl">
      <div className="bg-background/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] mx-3 sm:mx-4 px-3 sm:px-5 py-2 flex items-center gap-3 sm:gap-5 h-16 sm:h-20 transition-all duration-300 hover:bg-background/70 safe-area-inset w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] md:w-full md:mx-0">
        {/* Song info */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer group/info" onClick={() => setNowPlayingOpen(true)}>
          <motion.div layoutId="album-art" className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl shadow-lg flex-shrink-0 overflow-hidden ring-1 ring-white/10">
            {coverSrc ? (
              <img src={coverSrc} alt="" className="w-full h-full object-cover group-hover/info:scale-110 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center group-hover/info:bg-secondary/80 transition-colors">
                <span className="text-muted-foreground text-lg sm:text-xl">♪</span>
              </div>
            )}
          </motion.div>
          <div className="min-w-0 flex-1">
            <Marquee text={currentSong.title} className="text-xs sm:text-sm font-bold text-foreground group-hover/info:text-primary transition-colors leading-tight" />
            <p className="text-[9px] sm:text-[10px] text-muted-foreground/80 font-medium truncate mt-0.5">{currentSong.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-[1.5] flex flex-col items-center gap-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-5">
            <motion.button
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleShuffle}
              className={`transition-all p-1.5 rounded-full hover:bg-white/5 ${isShuffle ? "text-primary glow-primary" : "text-muted-foreground hover:text-foreground"}`}
              title="Shuffle"
            >
              <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </motion.button>

            <motion.button whileHover={{ scale: 1.2, x: -2 }} whileTap={{ scale: 0.9 }} onClick={previous} className="text-muted-foreground hover:text-foreground transition-all p-1.5 rounded-full hover:bg-white/5">
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={togglePlay}
              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)] transition-all duration-300"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 fill-current" /> : <Play className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 fill-current ml-0.5" />}
            </motion.button>

            <motion.button whileHover={{ scale: 1.2, x: 2 }} whileTap={{ scale: 0.9 }} onClick={next} className="text-muted-foreground hover:text-foreground transition-all p-1.5 rounded-full hover:bg-white/5">
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.2, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleRepeat}
              className={`transition-all p-1.5 rounded-full hover:bg-white/5 ${repeatMode !== "none" ? "text-primary glow-primary" : "text-muted-foreground hover:text-foreground"}`}
              title={repeatMode === "none" ? "Enable Repeat" : repeatMode === "all" ? "Repeat One" : "Disable Repeat"}
            >
              {repeatMode === "one" ? <Repeat1 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </motion.button>
          </div>

          <div className="w-full hidden sm:flex items-center gap-2.5 px-2">
            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground w-8 text-right tabular-nums tracking-tighter">{formatTime(currentTime)}</span>
            <Slider value={[currentTime]} max={duration || 100} step={1} onValueChange={(vals) => seek(vals[0])} className="flex-1" />
            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground w-8 tabular-nums tracking-tighter">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center justify-end flex-1 group/volume pr-1">
          <div className="flex items-center gap-2.5 w-28 bg-white/5 px-2.5 py-1.5 rounded-xl transition-all hover:bg-white/10 ring-1 ring-white/5">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setVolume(volume > 0 ? 0 : 0.8)} className="text-muted-foreground hover:text-foreground transition-colors">
              {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </motion.button>
            <Slider value={[volume]} max={1} step={0.01} onValueChange={(vals) => setVolume(vals[0])} className="flex-1" />
          </div>
        </div>
      </div>
    </footer>
  );
}
