import { useEffect, useState, memo } from "react";
import { getRandomSongs, SubsonicSong, getCoverArtUrl } from "../services/subsonicApi";
import { usePlayer } from "../contexts/PlayerContext";
import { Play, Clock, Music } from "lucide-react";
import { motion } from "framer-motion";

function formatDuration(sec?: number) {
    if (!sec) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

const TrackList = memo(() => {
    const [songs, setSongs] = useState<SubsonicSong[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { playSong, currentSong, isPlaying } = usePlayer();

    useEffect(() => {
        setLoading(true);
        getRandomSongs(100)
            .then(setSongs)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-4 md:p-6">
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-6">All Tracks</h2>
                <div className="space-y-2 md:space-y-3">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center gap-4 px-2 md:px-4 py-2 md:py-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-secondary rounded" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 md:h-4 bg-secondary rounded w-1/3" />
                                <div className="h-2 md:h-3 bg-secondary rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <p className="text-destructive mb-2">Failed to load tracks</p>
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-6 md:mb-8 text-center sm:text-left">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">All Tracks</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Every song in your collection</p>
            </header>

            <div className="bg-secondary/20 rounded-2xl md:rounded-3xl p-1 md:p-4">
                <div className="grid grid-cols-[3rem_1fr_auto] md:grid-cols-[4rem_1fr_1fr_auto] gap-2 md:gap-4 px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold border-b border-border/50">
                    <span className="text-center">#</span>
                    <span>Title</span>
                    <span className="hidden md:block">Album</span>
                    <div className="flex justify-end pr-2">
                        <Clock className="w-3.5 h-3.5" />
                    </div>
                </div>
                <div className="mt-1 md:mt-2 space-y-0.5 md:space-y-1">
                    {songs.map((song, i) => {
                        const isActive = currentSong?.id === song.id;
                        const coverSrc = song.coverArt ? getCoverArtUrl(song.coverArt, 80) : "";

                        return (
                            <motion.button
                                whileTap={{ scale: 0.99 }}
                                key={song.id}
                                onClick={() => playSong(song, songs)}
                                className={`w-full grid grid-cols-[3rem_1fr_auto] md:grid-cols-[4rem_1fr_1fr_auto] gap-2 md:gap-4 px-3 md:px-6 py-2 md:py-3.5 rounded-lg md:rounded-xl text-[13px] md:text-sm hover:bg-secondary/40 transition-all group ${isActive ? "bg-primary/10 text-primary" : "text-foreground"
                                    }`}
                            >
                                <div className="flex items-center justify-center relative">
                                    {isActive && isPlaying ? (
                                        <div className="flex gap-0.5 items-end h-3">
                                            <div className="w-0.5 bg-primary animate-music-bar-1" />
                                            <div className="w-0.5 bg-primary animate-music-bar-2" />
                                            <div className="w-0.5 bg-primary animate-music-bar-3" />
                                        </div>
                                    ) : (
                                        <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden shadow-md">
                                            {coverSrc ? (
                                                <img src={coverSrc} alt="" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                                            ) : (
                                                <div className="w-full h-full bg-secondary flex items-center justify-center">
                                                    <Music className="w-4 h-4 text-muted-foreground transition-transform group-hover:scale-110" />
                                                </div>
                                            )}
                                            <Play className="absolute inset-0 m-auto w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col text-left truncate">
                                    <span className="font-medium truncate">{song.title}</span>
                                    <span className="text-xs text-muted-foreground truncate">
                                        {song.artist}
                                        <span className="md:hidden"> • {song.album}</span>
                                    </span>
                                </div>

                                <div className="hidden md:flex items-center text-muted-foreground truncate text-left">
                                    <span className="truncate">{song.album}</span>
                                </div>

                                <div className="flex items-center justify-end text-muted-foreground text-xs pr-1">
                                    {formatDuration(song.duration)}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

TrackList.displayName = "TrackList";

export default TrackList;
