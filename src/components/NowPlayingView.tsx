import { usePlayer } from "../contexts/PlayerContext";
import { ChevronDown, SkipBack, SkipForward, Play, Pause, Volume2, Shuffle, Repeat, Repeat1 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Marquee } from "./Marquee";

export default function NowPlayingView() {
    const {
        currentSong,
        isPlaying,
        togglePlay,
        next,
        previous,
        currentTime,
        duration,
        seek,
        volume,
        setVolume,
        isNowPlayingOpen,
        setNowPlayingOpen,
        coverUrl,
        isShuffle,
        repeatMode,
        toggleShuffle,
        toggleRepeat
    } = usePlayer();

    if (!currentSong) return null;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const coverSrc = currentSong.coverArt ? coverUrl(currentSong.coverArt) : "";

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <AnimatePresence>
            {isNowPlayingOpen && (
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-50 bg-background flex flex-col"
                >
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-between p-6"
                    >
                        <motion.button
                            whileHover={{ scale: 1.1, y: 2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setNowPlayingOpen(false)}
                            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronDown className="w-8 h-8" />
                        </motion.button>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Now Playing</span>
                        <div className="w-8" />
                    </motion.div>

                    <div className="flex-1 flex flex-col px-8 pb-12 overflow-y-auto">
                        {/* Album Art Container */}
                        <div className="flex-1 flex items-center justify-center max-h-[50vh] mb-8">
                            <motion.div
                                layoutId="album-art"
                                className="relative w-full aspect-square max-w-[400px] shadow-2xl rounded-2xl overflow-hidden"
                            >
                                {coverSrc ? (
                                    <motion.img
                                        src={coverSrc}
                                        alt={currentSong.title}
                                        className="w-full h-full object-cover"
                                        animate={{ scale: isPlaying ? 1 : 0.9, opacity: isPlaying ? 1 : 0.8 }}
                                        transition={{ duration: 0.6 }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-secondary flex items-center justify-center text-8xl text-muted-foreground">♪</div>
                                )}
                            </motion.div>
                        </div>

                        {/* Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mb-8"
                        >
                            <Marquee
                                text={currentSong.title}
                                className="text-2xl sm:text-3xl font-bold text-foreground mb-1"
                            />
                            <p className="text-lg text-muted-foreground truncate">{currentSong.artist}</p>
                        </motion.div>

                        {/* Progress */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-4 mb-8"
                        >
                            <Slider
                                value={[currentTime]}
                                max={duration || 100}
                                step={1}
                                onValueChange={(vals) => seek(vals[0])}
                                className="mb-2"
                            />
                            <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </motion.div>

                        {/* Controls */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center justify-between mb-12 max-w-[400px] mx-auto w-full"
                        >
                            <motion.button
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleShuffle}
                                className={`p-2 transition-colors relative ${isShuffle ? "text-primary" : "text-foreground/60 hover:text-foreground"}`}
                            >
                                <Shuffle className="w-6 h-6" />
                                {isShuffle && (
                                    <motion.div
                                        layoutId="shuffle-dot"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                                    />
                                )}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.2, color: "var(--primary)" }}
                                whileTap={{ scale: 0.9 }}
                                onClick={previous}
                                className="p-2 text-foreground transition-colors"
                            >
                                <SkipBack className="w-8 h-8 fill-current" />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={togglePlay}
                                className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform glow-primary"
                            >
                                {isPlaying ? (
                                    <Pause className="w-8 h-8 fill-current" />
                                ) : (
                                    <Play className="w-8 h-8 fill-current ml-1" />
                                )}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.2, color: "var(--primary)" }}
                                whileTap={{ scale: 0.9 }}
                                onClick={next}
                                className="p-2 text-foreground transition-colors"
                            >
                                <SkipForward className="w-8 h-8 fill-current" />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleRepeat}
                                className={`p-2 transition-colors relative ${repeatMode !== "none" ? "text-primary" : "text-foreground/60 hover:text-foreground"}`}
                            >
                                {repeatMode === "one" ? <Repeat1 className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
                                {repeatMode !== "none" && (
                                    <motion.div
                                        layoutId="repeat-dot"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                                    />
                                )}
                            </motion.button>
                        </motion.div>

                        {/* Volume */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center gap-4 px-4 py-2 bg-secondary/20 rounded-2xl group/volume"
                        >
                            <Volume2 className="w-5 h-5 text-muted-foreground" />
                            <Slider
                                value={[volume]}
                                max={1}
                                step={0.01}
                                onValueChange={(vals) => setVolume(vals[0])}
                                className="flex-1"
                            />
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
