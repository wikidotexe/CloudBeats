import { useEffect, useState, memo } from "react";
import { getPlaylist, SubsonicSong, getCoverArtUrl } from "../services/subsonicApi";
import { usePlayer } from "../contexts/PlayerContext";
import { Play, ArrowLeft, Clock, ListMusic } from "lucide-react";

interface PlaylistViewProps {
    playlistId: string;
    onBack: () => void;
}

function formatDuration(sec?: number) {
    if (!sec) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

const PlaylistView = memo(({ playlistId, onBack }: PlaylistViewProps) => {
    const [playlist, setPlaylist] = useState<{ id: string; name: string; songs: SubsonicSong[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const { playSong, currentSong, isPlaying } = usePlayer();

    useEffect(() => {
        setLoading(true);
        getPlaylist(playlistId)
            .then((data) => {
                setPlaylist(data);
            })
            .catch((err) => {
                console.error("Failed to fetch playlist details:", err);
            })
            .finally(() => setLoading(false));
    }, [playlistId]);

    if (loading) {
        return (
            <div className="p-4 md:p-6 animate-pulse">
                <div className="flex gap-4 md:gap-6 mb-8">
                    <div className="w-32 h-32 md:w-48 md:h-48 bg-secondary rounded-2xl" />
                    <div className="flex-1 flex flex-col justify-end">
                        <div className="h-6 md:h-8 bg-secondary rounded w-1/2 mb-3" />
                        <div className="h-3 md:h-4 bg-secondary rounded w-1/3" />
                    </div>
                </div>
            </div>
        );
    }

    if (!playlist) return null;

    const songs = playlist.songs;
    // Use the cover art of the first song as the playlist cover if available
    const firstSongWithCover = songs.find(s => s.coverArt);
    const coverSrc = firstSongWithCover ? getCoverArtUrl(firstSongWithCover.coverArt!, 500) : "";

    return (
        <div className="p-4 md:p-8 overflow-y-auto scrollbar-thin animate-in fade-in duration-500">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 md:6 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            {/* Playlist header */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-6 md:mb-10">
                {coverSrc ? (
                    <img src={coverSrc} alt={playlist.name} className="w-32 h-32 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-2xl mx-auto sm:mx-0 shadow-primary/10" />
                ) : (
                    <div className="w-32 h-32 sm:w-56 sm:h-56 rounded-2xl bg-gradient-to-br from-secondary to-secondary/30 flex items-center justify-center text-4xl sm:text-6xl text-muted-foreground/30 mx-auto sm:mx-0">
                        <ListMusic className="w-16 h-16 sm:w-24 sm:h-24" />
                    </div>
                )}
                <div className="flex flex-col justify-end text-center sm:text-left">
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-primary font-bold mb-1 md:2">Playlist</p>
                    <h2 className="font-display text-2xl sm:text-5xl font-bold text-foreground mb-2 md:4 leading-tight">{playlist.name}</h2>
                    <p className="text-xs sm:text-base text-muted-foreground mb-4 md:6">
                        {songs.length} {songs.length === 1 ? 'song' : 'songs'}
                    </p>
                    <button
                        onClick={() => songs.length > 0 && playSong(songs[0], songs)}
                        className="inline-flex items-center gap-2 px-6 sm:px-8 py-2 md:py-3 rounded-full bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:scale-105 transition-all glow-primary w-fit mx-auto sm:mx-0 shadow-lg shadow-primary/20"
                    >
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> Play Now
                    </button>
                </div>
            </div>

            {/* Track list */}
            <div className="bg-secondary/20 rounded-2xl md:rounded-3xl p-1 md:p-4">
                <div className="grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3.5rem_1fr_auto] gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold border-b border-border/50">
                    <span className="text-center">#</span>
                    <span>Title</span>
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <div className="mt-1 md:mt-2 space-y-0.5 md:space-y-1">
                    {songs.map((song, i) => {
                        const isActive = currentSong?.id === song.id;
                        return (
                            <button
                                key={song.id}
                                onClick={() => playSong(song, songs)}
                                className={`w-full grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3.5rem_1fr_auto] gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm hover:bg-secondary/40 transition-all group ${isActive ? "bg-primary/10 text-primary" : "text-foreground"
                                    }`}
                            >
                                <span className="flex items-center justify-center">
                                    {isActive && isPlaying ? (
                                        <div className="flex gap-0.5 items-end h-3">
                                            <div className="w-0.5 bg-primary animate-music-bar-1" />
                                            <div className="w-0.5 bg-primary animate-music-bar-2" />
                                            <div className="w-0.5 bg-primary animate-music-bar-3" />
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground group-hover:hidden">{i + 1}</span>
                                    )}
                                    {!isActive && <Play className="w-3 h-3 hidden group-hover:block fill-current font-bold" />}
                                    {isActive && !isPlaying && <Play className="w-3 h-3 fill-current" />}
                                </span>
                                <div className="text-left flex flex-col w-full overflow-hidden">
                                    <span className="font-semibold truncate">{song.title}</span>
                                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{song.artist} • {song.album}</span>
                                </div>
                                <span className="flex items-center text-muted-foreground font-mono text-[10px] sm:text-sm">{formatDuration(song.duration)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

PlaylistView.displayName = "PlaylistView";

export default PlaylistView;
