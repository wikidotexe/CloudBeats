import { useEffect, useState, memo } from "react";
import { getAlbum, SubsonicAlbum, SubsonicSong, getCoverArtUrl } from "../services/subsonicApi";
import { usePlayer } from "../contexts/PlayerContext";
import { Play, ArrowLeft, Clock } from "lucide-react";

interface AlbumViewProps {
  albumId: string;
  onBack: () => void;
}

function formatDuration(sec?: number) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const AlbumView = memo(({ albumId, onBack }: AlbumViewProps) => {
  const [album, setAlbum] = useState<SubsonicAlbum | null>(null);
  const [songs, setSongs] = useState<SubsonicSong[]>([]);
  const [loading, setLoading] = useState(true);
  const { playSong, currentSong, isPlaying } = usePlayer();

  useEffect(() => {
    setLoading(true);
    getAlbum(albumId)
      .then(({ album, songs }) => {
        setAlbum(album);
        setSongs(songs);
      })
      .finally(() => setLoading(false));
  }, [albumId]);

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="flex gap-6 mb-8">
          <div className="w-48 h-48 bg-secondary rounded-lg" />
          <div className="flex-1">
            <div className="h-8 bg-secondary rounded w-1/2 mb-3" />
            <div className="h-4 bg-secondary rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!album) return null;

  const coverSrc = album.coverArt ? getCoverArtUrl(album.coverArt, 500) : "";

  return (
    <div className="p-6 overflow-y-auto scrollbar-thin">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Album header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8">
        {coverSrc ? (
          <img src={coverSrc} alt={album.name} className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg object-cover shadow-2xl mx-auto sm:mx-0" />
        ) : (
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg bg-secondary flex items-center justify-center text-5xl sm:text-6xl text-muted-foreground mx-auto sm:mx-0">♪</div>
        )}
        <div className="flex flex-col justify-end text-center sm:text-left">
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1">Album</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2 line-clamp-2">{album.name}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {album.artist} {album.year && `• ${album.year}`} • {album.songCount} songs
          </p>
          <button
            onClick={() => songs.length > 0 && playSong(songs[0], songs)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-105 transition-transform glow-primary w-fit mx-auto sm:mx-0"
          >
            <Play className="w-4 h-4" /> Play All
          </button>
        </div>
      </div>


      {/* Track list */}
      <div className="rounded-lg overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_auto] gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
          <span>#</span>
          <span>Title</span>
          <Clock className="w-3.5 h-3.5" />
        </div>
        {songs.map((song, i) => {
          const isActive = currentSong?.id === song.id;
          return (
            <button
              key={song.id}
              onClick={() => playSong(song, songs)}
              className={`w-full grid grid-cols-[2rem_1fr_auto] gap-4 px-4 py-3 text-sm hover:bg-secondary/50 transition-colors ${isActive ? "text-primary" : "text-foreground"
                }`}
            >
              <span className="text-muted-foreground text-right">
                {isActive && isPlaying ? (
                  <span className="text-primary animate-pulse-glow">▶</span>
                ) : (
                  i + 1
                )}
              </span>
              <span className="text-left truncate">
                {song.title}
                {song.artist && song.artist !== album.artist && (
                  <span className="text-muted-foreground ml-2">— {song.artist}</span>
                )}
              </span>
              <span className="text-muted-foreground">{formatDuration(song.duration)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

AlbumView.displayName = "AlbumView";

export default AlbumView;
