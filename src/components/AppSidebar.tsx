import { memo } from "react";
import { Settings, Music, Disc3, Users, ListMusic } from "lucide-react";
import { motion } from "framer-motion";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onOpenSettings: () => void;
  onAlbumSelect: (id: string) => void;
}

const AppSidebar = memo(({ activeView, onViewChange, onOpenSettings, onAlbumSelect }: SidebarProps) => {
  const navItems = [
    { id: "albums", label: "Albums", icon: Disc3 },
    { id: "artists", label: "Artists", icon: Users },
    { id: "tracks", label: "Tracks", icon: Music },
    { id: "playlists", label: "Playlists", icon: ListMusic },
  ];


  return (
    <aside className="w-full md:w-64 h-full flex flex-col bg-sidebar border-r border-sidebar-border">


      <div className="p-5 flex items-center gap-2">
        <Music className="w-6 h-6 text-primary" />
        <h1 className="font-display text-lg font-bold text-foreground">CloudBeats</h1>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1">
        <p className="px-3 mb-2 text-xs text-muted-foreground uppercase tracking-wider">Library</p>
        {navItems.map((item) => (
          <motion.button
            whileTap={{ scale: 0.96 }}
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === item.id
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </motion.button>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-sidebar-border">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </motion.button>
      </div>
    </aside>
  );
});

AppSidebar.displayName = "AppSidebar";

export default AppSidebar;
