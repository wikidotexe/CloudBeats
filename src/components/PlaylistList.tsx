import { useState, useEffect } from "react";
import { getPlaylists, getPlaylist, getCoverArtUrl } from "../services/subsonicApi";
import { Music, Play, ListMusic, Loader2 } from "lucide-react";
import { usePlayer } from "../contexts/PlayerContext";
import { motion } from "framer-motion";

interface PlaylistListProps {
    onPlaylistSelect: (id: string) => void;
}

const PlaylistList = ({ onPlaylistSelect }: PlaylistListProps) => {
    const [playlists, setPlaylists] = useState<{ id: string; name: string; songCount: number; duration: number; coverArt?: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const { playSong } = usePlayer();

    useEffect(() => {
        const fetchPlaylists = async () => {
            try {
                const data = await getPlaylists();
                setPlaylists(data);
            } catch (error) {
                console.error("Failed to fetch playlists:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlaylists();
    }, []);

    const handlePlayPlaylist = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            const { songs } = await getPlaylist(id);
            if (songs.length > 0) {
                playSong(songs[0], songs);
            }
        } catch (error) {
            console.error("Failed to play playlist:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (playlists.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-50">
                <ListMusic className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-medium">No playlists found</h3>
                <p className="max-w-xs mx-auto mt-2">Create some playlists in your music server to see them here.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-6 md:mb-8 text-center sm:text-left">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Playlists</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Your curated collections</p>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {playlists.map((playlist) => (
                    <motion.div
                        key={playlist.id}
                        whileHover={{ y: -5 }}
                        className="group cursor-pointer"
                        onClick={() => onPlaylistSelect(playlist.id)}
                    >
                        <div className="aspect-square rounded-2xl bg-secondary/50 overflow-hidden mb-3 relative shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                            {playlist.coverArt ? (
                                <img
                                    src={getCoverArtUrl(playlist.coverArt, 400)}
                                    alt={playlist.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/30">
                                    <ListMusic className="w-12 h-12 text-muted-foreground/50" />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => handlePlayPlaylist(e, playlist.id)}
                                    className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                                >
                                    <Play className="w-6 h-6 fill-current ml-1" />
                                </motion.button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {playlist.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {playlist.songCount} {playlist.songCount === 1 ? 'song' : 'songs'}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default PlaylistList;
