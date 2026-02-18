import { useEffect, useState, memo } from "react";
import { getAlbumList, SubsonicAlbum, getCoverArtUrl, getAlbum } from "../services/subsonicApi";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { usePlayer } from "../contexts/PlayerContext";

interface AlbumGridProps {
  onAlbumSelect: (id: string) => void;
}

const AlbumGrid = memo(({ onAlbumSelect }: AlbumGridProps) => {
  const [albums, setAlbums] = useState<SubsonicAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortType, setSortType] = useState("newest");
  const { playSong } = usePlayer();

  useEffect(() => {
    setLoading(true);
    setError("");
    getAlbumList(sortType, 50)
      .then(setAlbums)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sortType]);

  const handlePlayAlbum = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { songs } = await getAlbum(id);
      if (songs.length > 0) {
        playSong(songs[0], songs);
      }
    } catch (error) {
      console.error("Failed to play album:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-secondary rounded-lg mb-2" />
              <div className="h-3 bg-secondary rounded w-3/4 mb-1" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive mb-2">Failed to load albums</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
        <header className="text-center sm:text-left">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Albums</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Browse your music library</p>
        </header>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
          {["newest", "frequent", "recent", "random"].map((t) => (
            <button
              key={t}
              onClick={() => setSortType(t)}
              className={`flex-shrink-0 px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-medium transition-colors capitalize ${sortType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
        {albums.map((album) => (
          <motion.div
            key={album.id}
            whileHover={{ y: -5 }}
            className="group cursor-pointer p-2 md:p-3"
            onClick={() => onAlbumSelect(album.id)}
          >
            <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-secondary relative shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
              {album.coverArt ? (
                <img
                  src={getCoverArtUrl(album.coverArt, 400)}
                  alt={album.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl bg-gradient-to-br from-secondary to-secondary/30">♪</div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handlePlayAlbum(e, album.id)}
                  className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                >
                  <Play className="w-6 h-6 fill-current ml-1" />
                </motion.button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{album.name}</p>
              <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

AlbumGrid.displayName = "AlbumGrid";

export default AlbumGrid;
