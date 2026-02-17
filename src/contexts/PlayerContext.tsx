import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { SubsonicSong, getStreamUrl, getCoverArtUrl } from "../services/subsonicApi";

export type RepeatMode = "none" | "all" | "one";
interface PlayerState {
  currentSong: SubsonicSong | null;
  queue: SubsonicSong[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isNowPlayingOpen: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  eqEnabled: boolean;
  eqPreset: string;
  eqGains: number[];
}

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: Record<string, number[]> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  pop: [3, 2, 1, -1, -2, -2, 0, 1, 2, 3],
  rock: [4, 3, 2, 1, -1, -1, 0, 1, 2, 4],
  jazz: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
  classic: [4, 3, 2, 1, -1, -2, -2, 0, 1, 2],
  hiphop: [5, 4, 1, 2, -1, -1, 0, 1, 4, 5],
  rb: [4, 3, 1, 2, -1, -1, 1, 2, 3, 4],
  electronic: [5, 4, 1, 0, 2, 1, 1, 2, 4, 5],
  bass: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};


interface PlayerContextType extends PlayerState {
  playSong: (song: SubsonicSong, queue?: SubsonicSong[]) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setNowPlayingOpen: (open: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  coverUrl: (id?: string) => string;
  toggleEq: () => void;
  setEqPreset: (preset: string) => void;
  setEqGain: (index: number, gain: number) => void;
}


const PERSISTENCE_KEY = "cloudbeats_player_state";

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
}

function updateMediaSession(song: SubsonicSong | null) {
  if (!("mediaSession" in navigator) || !song) return;

  const coverArt = song.coverArt ? getCoverArtUrl(song.coverArt, 512) : undefined;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist || "Unknown Artist",
    album: song.album || "Unknown Album",
    artwork: coverArt
      ? [
        { src: coverArt, sizes: "512x512", type: "image/jpeg" },
      ]
      : [],
  });
}

function setupMediaSessionHandlers(handlers: {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (time: number) => void;
}) {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.setActionHandler("play", handlers.play);
  navigator.mediaSession.setActionHandler("pause", handlers.pause);
  navigator.mediaSession.setActionHandler("nexttrack", handlers.next);
  navigator.mediaSession.setActionHandler("previoustrack", handlers.previous);
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.seekTime !== undefined) handlers.seekTo(details.seekTime);
  });
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [state, setState] = useState<PlayerState>(() => {
    const saved = localStorage.getItem(PERSISTENCE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          currentSong: parsed.currentSong || null,
          queue: parsed.queue || [],
          queueIndex: parsed.queueIndex ?? -1,
          isPlaying: false,
          currentTime: parsed.currentTime || 0,
          duration: 0,
          volume: parsed.volume ?? 0.8,
          isNowPlayingOpen: false,
          isShuffle: parsed.isShuffle ?? false,
          repeatMode: parsed.repeatMode ?? "none",
          eqEnabled: parsed.eqEnabled ?? false,
          eqPreset: parsed.eqPreset ?? "flat",
          eqGains: parsed.eqGains ?? EQ_PRESETS.flat,
        };
      } catch (e) {
        console.error("Failed to load player state", e);
      }
    }
    return {
      currentSong: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isNowPlayingOpen: false,
      isShuffle: false,
      repeatMode: "none",
      eqEnabled: false,
      eqPreset: "flat",
      eqGains: EQ_PRESETS.flat,
    };
  });


  const nextTrackRef = useRef<() => void>(() => { });
  const previousRef = useRef<() => void>(() => { });
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = state.volume;
    if (state.currentSong) {
      audio.src = getStreamUrl(state.currentSong.id);
      audio.currentTime = state.currentTime;
    }
    audioRef.current = audio;

    // Wait for first user interaction to create AudioContext if needed
    const initAudioContext = () => {
      if (!audioCtxRef.current && audioRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        // Create filters
        const filters = EQ_FREQUENCIES.map((freq, i) => {
          const filter = ctx.createBiquadFilter();
          filter.type = i === 0 ? "lowshelf" : i === EQ_FREQUENCIES.length - 1 ? "highshelf" : "peaking";
          filter.frequency.value = freq;
          filter.gain.value = state.eqEnabled ? state.eqGains[i] : 0;
          return filter;
        });
        filtersRef.current = filters;

        // Connect chain
        const source = ctx.createMediaElementSource(audioRef.current);
        sourceNodeRef.current = source;

        // Connect filters in series
        let lastNode: AudioNode = source;
        filters.forEach(f => {
          lastNode.connect(f);
          lastNode = f;
        });
        lastNode.connect(ctx.destination);
      } else if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };

    const handlePlay = () => {
      initAudioContext();
    };

    audio.addEventListener("play", handlePlay);

    audio.addEventListener("timeupdate", () => {
      const now = Date.now();
      // Throttle updates to ~250ms to prevent excessive rendering
      if (now - lastUpdateRef.current < 250) return;
      lastUpdateRef.current = now;

      setState((s) => ({ ...s, currentTime: audio.currentTime, duration: audio.duration || 0 }));
      // Update position state for media session
      if ("mediaSession" in navigator && !isNaN(audio.duration)) {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      }
    });
    audio.addEventListener("ended", () => {
      // Use logic from nextTrack but specifically for 'ended' event
      setState((prev) => {
        if (prev.repeatMode === "one") {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.error("Playback failed", e));
          }
          return { ...prev, currentTime: 0, isPlaying: true };
        }

        let nextIdx = prev.queueIndex + 1;

        if (prev.isShuffle && prev.queue.length > 1) {
          // simple random that isn't current
          let rand;
          do {
            rand = Math.floor(Math.random() * prev.queue.length);
          } while (rand === prev.queueIndex);
          nextIdx = rand;
        }

        if (nextIdx < prev.queue.length) {
          const song = prev.queue[nextIdx];
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = getStreamUrl(song.id);
            audioRef.current.load();
            audioRef.current.play().catch(e => console.error("Playback failed", e));
          }
          updateMediaSession(song);
          return { ...prev, currentSong: song, queueIndex: nextIdx, isPlaying: true };
        }

        if (prev.repeatMode === "all" && prev.queue.length > 0) {
          const song = prev.queue[0];
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = getStreamUrl(song.id);
            audioRef.current.load();
            audioRef.current.play().catch(e => console.error("Playback failed", e));
          }
          updateMediaSession(song);
          return { ...prev, currentSong: song, queueIndex: 0, isPlaying: true };
        }

        return { ...prev, isPlaying: false };
      });
    });
    audio.addEventListener("play", () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
      }
    });
    audio.addEventListener("pause", () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
    });

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("play", handlePlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync filter gains with state
  useEffect(() => {
    if (filtersRef.current.length > 0) {
      filtersRef.current.forEach((filter, i) => {
        filter.gain.setTargetAtTime(state.eqEnabled ? state.eqGains[i] : 0, (audioCtxRef.current?.currentTime || 0), 0.1);
      });
    }
  }, [state.eqEnabled, state.eqGains]);

  const playSong = useCallback((song: SubsonicSong, queue?: SubsonicSong[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newQueue = queue || [song];
    const idx = queue ? queue.findIndex((s) => s.id === song.id) : 0;

    // Efficient switch
    audio.pause();
    audio.src = getStreamUrl(song.id);
    audio.load(); // Force buffer start
    audio.play().catch(e => console.error("Playback failed", e));

    // Ensure AudioContext is resumed on user interaction
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }

    updateMediaSession(song);
    setState((s) => ({ ...s, currentSong: song, queue: newQueue, queueIndex: idx >= 0 ? idx : 0, isPlaying: true }));
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentSong) return;
    if (audio.paused) {
      audio.play();
      setState((s) => ({ ...s, isPlaying: true }));
      // Ensure AudioContext is resumed on user interaction
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } else {
      audio.pause();
      setState((s) => ({ ...s, isPlaying: false }));
    }
  }, [state.currentSong]);

  const nextTrack = useCallback(() => {
    setState((prev) => {
      let nextIdx = prev.queueIndex + 1;

      if (prev.isShuffle && prev.queue.length > 1) {
        let rand;
        do {
          rand = Math.floor(Math.random() * prev.queue.length);
        } while (rand === prev.queueIndex);
        nextIdx = rand;
      }

      if (nextIdx < prev.queue.length) {
        const song = prev.queue[nextIdx];
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          audio.src = getStreamUrl(song.id);
          audio.load();
          audio.play().catch(e => console.error("Playback failed", e));
        }
        updateMediaSession(song);
        return { ...prev, currentSong: song, queueIndex: nextIdx, isPlaying: true };
      }

      if (prev.repeatMode === "all" && prev.queue.length > 0) {
        const song = prev.queue[0];
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          audio.src = getStreamUrl(song.id);
          audio.load();
          audio.play().catch(e => console.error("Playback failed", e));
        }
        updateMediaSession(song);
        return { ...prev, currentSong: song, queueIndex: 0, isPlaying: true };
      }

      // Resume context on track change
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }

      return { ...prev, isPlaying: false };
    });
  }, []);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setState((prev) => {
      const prevIdx = prev.queueIndex - 1;
      if (prevIdx >= 0) {
        const song = prev.queue[prevIdx];
        if (audio) {
          audio.pause();
          audio.src = getStreamUrl(song.id);
          audio.load();
          audio.play().catch(e => console.error("Playback failed", e));
        }
        updateMediaSession(song);
        return { ...prev, currentSong: song, queueIndex: prevIdx, isPlaying: true };
      }
    });
  }, []);

  // Persist state on core changes
  useEffect(() => {
    const {
      currentSong,
      queue,
      queueIndex,
      volume,
      currentTime,
      isShuffle,
      repeatMode,
      eqEnabled,
      eqPreset,
      eqGains
    } = state;
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify({
      currentSong,
      queue,
      queueIndex,
      volume,
      currentTime,
      isShuffle,
      repeatMode,
      eqEnabled,
      eqPreset,
      eqGains
    }));
  }, [state.currentSong, state.queue, state.queueIndex, state.volume, state.isShuffle, state.repeatMode, state.eqEnabled, state.eqPreset, state.eqGains]);

  // Periodically persist time to avoid heavy writes on every timeupdate
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current) {
        const saved = localStorage.getItem(PERSISTENCE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.currentTime = audioRef.current.currentTime;
          localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(parsed));
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Keep refs updated for event handlers
  useEffect(() => {
    nextTrackRef.current = nextTrack;
    previousRef.current = previous;
  }, [nextTrack, previous]);

  // Setup media session action handlers
  useEffect(() => {
    setupMediaSessionHandlers({
      play: () => {
        const audio = audioRef.current;
        if (audio) {
          audio.play();
          setState((s) => ({ ...s, isPlaying: true }));
        }
      },
      pause: () => {
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          setState((s) => ({ ...s, isPlaying: false }));
        }
      },
      next: () => nextTrackRef.current(),
      previous: () => previousRef.current(),
      seekTo: (time: number) => {
        const audio = audioRef.current;
        if (audio) audio.currentTime = time;
      },
    });
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
  }, []);

  const setVolume = useCallback((vol: number) => {
    const audio = audioRef.current;
    if (audio) audio.volume = vol;
    setState((s) => ({ ...s, volume: vol }));
  }, []);

  const setNowPlayingOpen = useCallback((open: boolean) => {
    setState((s) => ({ ...s, isNowPlayingOpen: open }));
  }, []);

  const toggleShuffle = useCallback(() => {
    setState((s) => ({ ...s, isShuffle: !s.isShuffle }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((s) => {
      const modes: RepeatMode[] = ["none", "all", "one"];
      const nextMode = modes[(modes.indexOf(s.repeatMode) + 1) % modes.length];
      return { ...s, repeatMode: nextMode };
    });
  }, []);

  const coverUrl = useCallback((id?: string) => {

    if (!id) return "";
    return getCoverArtUrl(id);
  }, []);

  const toggleEq = useCallback(() => {
    setState(s => ({ ...s, eqEnabled: !s.eqEnabled }));
  }, []);

  const setEqPreset = useCallback((preset: string) => {
    if (preset === "custom") {
      setState(s => ({ ...s, eqPreset: "custom" }));
    } else if (EQ_PRESETS[preset]) {
      setState(s => ({ ...s, eqPreset: preset, eqGains: EQ_PRESETS[preset] }));
    }
  }, []);

  const setEqGain = useCallback((index: number, gain: number) => {
    setState(s => {
      const newGains = [...s.eqGains];
      newGains[index] = gain;
      return { ...s, eqGains: newGains, eqPreset: "custom" };
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        playSong,
        togglePlay,
        next: nextTrack,
        previous,
        seek,
        setVolume,
        setNowPlayingOpen,
        toggleShuffle,
        toggleRepeat,
        coverUrl,
        toggleEq,
        setEqPreset,
        setEqGain
      }}
    >

      {children}
    </PlayerContext.Provider>
  );
}
