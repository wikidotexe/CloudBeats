import { useState, useEffect, useCallback } from "react";
import { getStoredConfig } from "../services/subsonicApi";
import AppSidebar from "../components/AppSidebar";
import PlayerBar from "../components/PlayerBar";
import AlbumGrid from "../components/AlbumGrid";
import AlbumView from "../components/AlbumView";
import ArtistList from "../components/ArtistList";
import TrackList from "../components/TrackList";
import PlaylistList from "../components/PlaylistList";
import PlaylistView from "../components/PlaylistView";
import SettingsModal from "../components/SettingsModal";
import { Music, Menu, Search, X } from "lucide-react";
import { search, SubsonicAlbum, SubsonicSong } from "../services/subsonicApi";
import { usePlayer } from "../contexts/PlayerContext";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const Index = () => {
  const [activeView, setActiveView] = useState("albums");
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ albums: SubsonicAlbum[]; songs: SubsonicSong[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const { playSong } = usePlayer();

  useEffect(() => {
    const cfg = getStoredConfig();
    if (cfg) {
      setConnected(true);
    } else {
      setSettingsOpen(true);
    }
  }, []);

  const handleConnected = () => {
    setConnected(true);
    setSettingsOpen(false);
  };

  const handleAlbumSelect = useCallback((id: string) => {
    setSelectedAlbum(id);
    setActiveView("album-detail");
    setSearchResults(null);
    setSearchQuery("");
  }, []);

  const handlePlaylistSelect = useCallback((id: string) => {
    setSelectedPlaylist(id);
    setActiveView("playlist-detail");
    setSearchResults(null);
    setSearchQuery("");
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await search(searchQuery);
      setSearchResults({ albums: res.albums, songs: res.songs });
    } catch {
      setSearchResults(null);
    }
    setSearching(false);
  };

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
  }, []);

  const handleViewChange = useCallback((v: string) => {
    setActiveView(v);
    setSelectedAlbum(null);
    setSelectedPlaylist(null);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const renderContent = () => {
    if (!connected) {
      return (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Music className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Welcome to CloudBeats</h2>
            <p className="text-muted-foreground mb-4 max-w-xs mx-auto">Connect to your Nextcloud Music server to start listening</p>
            <button onClick={() => setSettingsOpen(true)} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-105 transition-transform glow-primary">
              Connect Server
            </button>
          </div>
        </div>
      );
    }

    if (activeView === "album-detail" && selectedAlbum) {
      return (
        <div className="flex-1 overflow-y-auto scrollbar-thin pb-24 sm:pb-28 md:pb-32">
          <AlbumView
            albumId={selectedAlbum}
            onBack={() => {
              setSelectedAlbum(null);
              setActiveView("albums");
            }}
          />
        </div>
      );
    }

    if (activeView === "artists") {
      return (
        <div className="flex-1 overflow-y-auto scrollbar-thin pb-24 sm:pb-28 md:pb-32">
          <ArtistList onAlbumSelect={handleAlbumSelect} />
        </div>
      );
    }

    if (activeView === "tracks") {
      return (
        <div className="flex-1 overflow-y-auto scrollbar-thin pb-24 sm:pb-28 md:pb-32">
          <TrackList />
        </div>
      );
    }

    if (activeView === "playlists") {
      return (
        <div className="flex-1 overflow-y-auto scrollbar-thin pb-24 sm:pb-28 md:pb-32">
          <PlaylistList onPlaylistSelect={handlePlaylistSelect} />
        </div>
      );
    }

    if (activeView === "playlist-detail" && selectedPlaylist) {
      return (
        <div className="flex-1 overflow-y-auto scrollbar-thin pb-24 sm:pb-28 md:pb-32">
          <PlaylistView
            playlistId={selectedPlaylist}
            onBack={() => {
              setSelectedPlaylist(null);
              setActiveView("playlists");
            }}
          />
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin pb-24 sm:pb-28 md:pb-32">
        <AlbumGrid onAlbumSelect={handleAlbumSelect} />
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar/50 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2">
          <Music className="w-6 h-6 text-primary" />
          <h1 className="font-display text-lg font-bold text-foreground">CloudBeats</h1>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <Menu className="w-6 h-6 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r-sidebar-border bg-sidebar w-72">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">Browse your music library and settings</SheetDescription>
            <AppSidebar activeView={activeView} onViewChange={handleViewChange} onOpenSettings={handleOpenSettings} onAlbumSelect={handleAlbumSelect} />
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="hidden md:block flex-shrink-0">
          <AppSidebar activeView={activeView} onViewChange={handleViewChange} onOpenSettings={handleOpenSettings} onAlbumSelect={handleAlbumSelect} />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden relative min-h-0">
          {connected && (
            <header className="flex items-center justify-end px-6 py-4 bg-background/80 backdrop-blur-md z-10 flex-shrink-0">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search songs, albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-9 pr-8 py-2 rounded-full bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground border-none focus:ring-1 focus:ring-primary transition-all"
                />
                {searchQuery && (
                  <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </header>
          )}

          <div className="flex-1 overflow-hidden flex flex-col relative">
            {searchResults ? (
              <div className="absolute inset-0 z-20 bg-background overflow-y-auto scrollbar-thin p-8 pb-32">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold">Search Results</h2>
                  <button onClick={clearSearch} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Clear Results
                  </button>
                </div>

                <div className="space-y-12">
                  {searchResults.albums.length > 0 && (
                    <section>
                      <h3 className="text-xl font-semibold mb-4 text-muted-foreground">Albums</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {searchResults.albums.map((album) => (
                          <button key={album.id} onClick={() => handleAlbumSelect(album.id)} className="group text-left">
                            <div className="aspect-square rounded-xl bg-secondary overflow-hidden mb-3">
                              {album.coverArt ? (
                                <img
                                  src={searchQuery ? `/rest/getCoverArt?u=antigravity&t=token&s=salt&v=1.16.1&id=${album.coverArt}&size=300` : ""}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">♪</div>
                              )}
                            </div>
                            <p className="font-medium truncate">{album.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{album.artist}</p>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {searchResults.songs.length > 0 && (
                    <section>
                      <h3 className="text-xl font-semibold mb-4 text-muted-foreground">Songs</h3>
                      <div className="space-y-1">
                        {searchResults.songs.map((song) => (
                          <button key={song.id} onClick={() => playSong(song)} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors group">
                            <div className="w-10 h-10 rounded bg-secondary flex-shrink-0 flex items-center justify-center">
                              <Music className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="text-left flex-1 truncate">
                              <p className="font-medium truncate group-hover:text-primary transition-colors">{song.title}</p>
                              <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {searchResults.albums.length === 0 && searchResults.songs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                      <Search className="w-12 h-12 mb-4" />
                      <p className="text-xl font-medium">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </main>
      </div>
      <PlayerBar />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onConnected={handleConnected} />
    </div>
  );
};

export default Index;
