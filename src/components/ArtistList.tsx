import { useEffect, useState, memo } from "react";
import { getArtists, SubsonicArtist } from "../services/subsonicApi";
import { motion } from "framer-motion";
import { User } from "lucide-react";

interface ArtistListProps {
  onAlbumSelect: (id: string) => void;
}

const ArtistList = memo(({ onAlbumSelect }: ArtistListProps) => {
  const [artists, setArtists] = useState<SubsonicArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getArtists()
      .then(setArtists)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 animate-pulse">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8">Artists</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-secondary rounded-full" />
              <div className="h-4 bg-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6 md:mb-8 text-center sm:text-left">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Artists</h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">Discover your favorite performers</p>
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {artists.map((artist) => (
          <motion.div
            key={artist.id}
            whileHover={{ y: -5 }}
            className="text-center group cursor-pointer p-3 md:p-4 rounded-2xl transition-all hover:bg-secondary/20"
            onClick={() => onAlbumSelect(artist.id)}
          >
            <div className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full bg-gradient-to-br from-secondary/50 to-secondary/20 flex items-center justify-center text-xl md:text-3xl text-muted-foreground/50 mb-4 shadow-lg group-hover:shadow-primary/20 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300 relative overflow-hidden">
              <span className="relative z-10 group-hover:text-primary transition-colors font-bold uppercase">{artist.name.charAt(0)}</span>
              <User className="absolute inset-0 m-auto w-12 h-12 md:w-16 md:h-16 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" />
            </div>
            <p className="text-sm md:text-base font-bold text-foreground truncate group-hover:text-primary transition-colors mb-1">{artist.name}</p>
            {artist.albumCount !== undefined && (
              <p className="text-[10px] md:text-xs text-muted-foreground tracking-wide uppercase font-medium">{artist.albumCount} albums</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
});

ArtistList.displayName = "ArtistList";

export default ArtistList;
