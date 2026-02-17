import { useEffect, useState, memo } from "react";
import { getAlbumList, SubsonicAlbum, getCoverArtUrl } from "../services/subsonicApi";
import { motion } from "framer-motion";

interface AlbumGridProps {
  onAlbumSelect: (id: string) => void;
}

const AlbumGrid = memo(({ onAlbumSelect }: AlbumGridProps) => {
  const [albums, setAlbums] = useState<SubsonicAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortType, setSortType] = useState("newest");

  useEffect(() => {
    setLoading(true);
    setError("");
    getAlbumList(sortType, 50)
      .then(setAlbums)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sortType]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
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
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">Albums</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0">
          {["newest", "frequent", "recent", "random"].map((t) => (
            <button
              key={t}
              onClick={() => setSortType(t)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${sortType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {albums.map((album) => (
          <motion.button
            whileTap={{ scale: 0.97 }}
            key={album.id}
            onClick={() => onAlbumSelect(album.id)}
            className="group text-left rounded-lg p-3 transition-colors hover:bg-secondary/50"
          >
            <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-secondary relative">
              {album.coverArt ? (
                <img
                  src={getCoverArtUrl(album.coverArt, 300)}
                  alt={album.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">♪</div>
              )}
            </div>
            <p className="text-sm font-medium text-foreground truncate">{album.name}</p>
            <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
});

AlbumGrid.displayName = "AlbumGrid";

export default AlbumGrid;
