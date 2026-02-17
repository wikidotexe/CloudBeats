import { useEffect, useState } from "react";
import { getArtists, SubsonicArtist } from "../services/subsonicApi";

interface ArtistListProps {
  onAlbumSelect: (id: string) => void;
}

export default function ArtistList({ onAlbumSelect }: ArtistListProps) {
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
      <div className="p-6">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6">Artists</h2>
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-full" />
              <div className="h-4 bg-secondary rounded w-1/3" />
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
    <div className="p-6">
      <h2 className="font-display text-2xl font-bold text-foreground mb-6">Artists</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {artists.map((artist) => (
          <div key={artist.id} className="text-center group cursor-default">
            <div className="w-28 h-28 mx-auto rounded-full bg-secondary flex items-center justify-center text-2xl text-muted-foreground mb-3">
              {artist.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-medium text-foreground truncate">{artist.name}</p>
            {artist.albumCount !== undefined && (
              <p className="text-xs text-muted-foreground">{artist.albumCount} albums</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
