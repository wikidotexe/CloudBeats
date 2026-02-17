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
            <div className="p-6">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">All Tracks</h2>
                <div className="space-y-3">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center gap-4 px-4 py-3">
                            <div className="w-10 h-10 bg-secondary rounded" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-secondary rounded w-1/3" />
                                <div className="h-3 bg-secondary rounded w-1/4" />
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
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground">All Tracks</h2>
            </div>

            <div className="rounded-lg overflow-hidden">
                <div className="grid grid-cols-[3rem_1fr_auto] md:grid-cols-[3rem_1fr_1fr_auto] gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                    <span className="text-center">#</span>
                    <span>Title</span>
                    <span className="hidden md:block">Album</span>
                    <div className="flex justify-end pr-2">
                        <Clock className="w-3.5 h-3.5" />
                    </div>
                </div>

                <div className="divide-y divide-border/50">
                    {songs.map((song, i) => {
                        const isActive = currentSong?.id === song.id;
                        const coverSrc = song.coverArt ? getCoverArtUrl(song.coverArt, 80) : "";

                        return (
                            <motion.button
                                whileTap={{ scale: 0.99 }}
                                key={song.id}
                                onClick={() => playSong(song, songs)}
                                className={`w-full grid grid-cols-[3rem_1fr_auto] md:grid-cols-[3rem_1fr_1fr_auto] gap-4 px-4 py-3 text-sm hover:bg-secondary/30 transition-colors group ${isActive ? "text-primary bg-secondary/20" : "text-foreground"
                                    }`}
                            >
                                <div className="flex items-center justify-center relative">
                                    {isActive && isPlaying ? (
                                        <span className="text-primary animate-pulse-glow">▶</span>
                                    ) : (
                                        <div className="relative w-8 h-8 rounded overflow-hidden">
                                            {coverSrc ? (
                                                <img src={coverSrc} alt="" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                                            ) : (
                                                <div className="w-full h-full bg-secondary flex items-center justify-center">
                                                    <Music className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            <Play className="absolute inset-0 m-auto w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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
