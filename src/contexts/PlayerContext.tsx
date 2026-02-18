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
  seekBackward: () => void;
  seekForward: () => void;
}) {
  if (!("mediaSession" in navigator)) return;

  const wrappedPlay = () => {
    handlers.play();
  };

  const wrappedPause = () => {
    handlers.pause();
  };

  navigator.mediaSession.setActionHandler("play", wrappedPlay);
  navigator.mediaSession.setActionHandler("pause", wrappedPause);
  navigator.mediaSession.setActionHandler("nexttrack", handlers.next);
  navigator.mediaSession.setActionHandler("previoustrack", handlers.previous);
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.seekTime !== undefined) handlers.seekTo(details.seekTime);
  });
  navigator.mediaSession.setActionHandler("seekbackward", handlers.seekBackward);
  navigator.mediaSession.setActionHandler("seekforward", handlers.seekForward);
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
    audio.id = "pwa-audio-bridge";
    audio.crossOrigin = "anonymous";
    // Using setAttribute to avoid TS issues with HTMLAudioElement
    audio.setAttribute("playsinline", "true");
    audio.preload = "auto";
    audio.style.display = "none";

    const updateAudioVolume = () => {
      audio.volume = stateRef.current.volume;
    };
    updateAudioVolume();

    // Attach to DOM: Critical for many mobile browsers/PWAs to keep audio alive in background
    document.body.appendChild(audio);

    if (state.currentSong) {
      audio.src = getStreamUrl(state.currentSong.id);
      audio.currentTime = state.currentTime;
    }
    audioRef.current = audio;

    const queueRefInternal = { current: state.queue };
    const indexRefInternal = { current: state.queueIndex };
    const repeatRefInternal = { current: state.repeatMode };
    const shuffleRefInternal = { current: state.isShuffle };

    const handlePlay = () => {
      // Always try to resume AudioContext on play, even if EQ is disabled
      // This is crucial for background playback on mobile browsers
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      } else if (!audioCtxRef.current && stateRef.current.eqEnabled) {
        initAudioContext();
      }
    };

    audio.addEventListener("play", handlePlay);

    audio.addEventListener("timeupdate", () => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 250) return;
      lastUpdateRef.current = now;

      setState((s) => ({ ...s, currentTime: audio.currentTime, duration: audio.duration || 0 }));
      if ("mediaSession" in navigator && !isNaN(audio.duration)) {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      }
    });

    audio.addEventListener("ended", () => {
      const { queue, queueIndex, repeatMode, isShuffle } = stateRef.current;

      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(e => console.error("Playback failed", e));
        setState(s => ({ ...s, currentTime: 0, isPlaying: true }));
        return;
      }

      let nextIdx = queueIndex + 1;
      if (isShuffle && queue.length > 1) {
        let rand;
        do { rand = Math.floor(Math.random() * queue.length); } while (rand === queueIndex);
        nextIdx = rand;
      }

      if (nextIdx < queue.length || (repeatMode === "all" && queue.length > 0)) {
        const actualNextIdx = nextIdx < queue.length ? nextIdx : 0;
        const nextSong = queue[actualNextIdx];

        // Synchronous track switching to prevent background throttling
        audio.src = getStreamUrl(nextSong.id);
        audio.play().catch(e => console.error("Auto-play failed in background", e));
        updateMediaSession(nextSong);

        setState(s => ({ ...s, currentSong: nextSong, queueIndex: actualNextIdx, isPlaying: true, currentTime: 0 }));
      } else {
        setState(s => ({ ...s, isPlaying: false }));
      }
    });

    audio.addEventListener("error", (e) => {
      console.error("Audio element error", e);
      // Attempt recovery if it was playing
      if (stateRef.current.isPlaying && stateRef.current.currentSong) {
        setTimeout(() => {
          audio.src = getStreamUrl(stateRef.current.currentSong!.id);
          audio.load();
          audio.play().catch(console.error);
        }, 1000);
      }
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (audioCtxRef.current?.state === "suspended" && audioRef.current && !audioRef.current.paused) {
          audioCtxRef.current.resume();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      audio.pause();
      audio.src = "";
      if (document.body.contains(audio)) {
        document.body.removeChild(audio);
      }
      audio.removeEventListener("play", handlePlay);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initAudioContext = useCallback(() => {
    if (!audioRef.current) return;

    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Create filters
      const filters = EQ_FREQUENCIES.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? "lowshelf" : i === EQ_FREQUENCIES.length - 1 ? "highshelf" : "peaking";
        filter.frequency.value = freq;
        filter.gain.value = stateRef.current.eqEnabled ? stateRef.current.eqGains[i] : 0;
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

      // Critical: Ensure destination is connected if EQ is enabled
      lastNode.connect(ctx.destination);
    } else if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }, []);

  // Sync filter gains and initialization when EQ state changes
  useEffect(() => {
    if (state.eqEnabled && state.isPlaying) {
      initAudioContext();
    }

    if (filtersRef.current.length > 0) {
      filtersRef.current.forEach((filter, i) => {
        const targetGain = state.eqEnabled ? state.eqGains[i] : 0;
        filter.gain.setTargetAtTime(targetGain, (audioCtxRef.current?.currentTime || 0), 0.1);
      });
    }
  }, [state.eqEnabled, state.eqGains, state.isPlaying, initAudioContext]);

  const playSong = useCallback((song: SubsonicSong, queue?: SubsonicSong[]) => {
    const newQueue = queue || [song];
    const idx = newQueue.findIndex((s) => s.id === song.id);

    setState((s) => ({
      ...s,
      currentSong: song,
      queue: newQueue,
      queueIndex: idx >= 0 ? idx : 0,
      isPlaying: true,
      currentTime: 0
    }));
  }, []);

  // Effect to handle actual playback based on state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentSong) return;

    const streamUrl = getStreamUrl(state.currentSong.id);
    if (audio.src !== streamUrl) {
      audio.pause();
      audio.src = streamUrl;
      audio.load();
      if (state.currentTime > 0) {
        audio.currentTime = state.currentTime;
      }
      updateMediaSession(state.currentSong);
    }

    if (state.isPlaying) {
      // Sync volume before playing
      audio.volume = state.volume;

      audio.play().catch(e => {
        console.error("Playback failed in effect", e);
        // Don't auto-stop on mobile, sometimes it's just a temporary throttle
      });

      if (state.eqEnabled) {
        initAudioContext();
        if (audioCtxRef.current?.state === "suspended") {
          audioCtxRef.current.resume();
        }
      }
    } else {
      audio.pause();
    }
  }, [state.currentSong?.id, state.isPlaying]);

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
        return { ...prev, currentSong: prev.queue[nextIdx], queueIndex: nextIdx, isPlaying: true, currentTime: 0 };
      }

      if (prev.repeatMode === "all" && prev.queue.length > 0) {
        return { ...prev, currentSong: prev.queue[0], queueIndex: 0, isPlaying: true, currentTime: 0 };
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
        return { ...prev, currentSong: prev.queue[prevIdx], queueIndex: prevIdx, isPlaying: true, currentTime: 0 };
      }
      return prev;
    });
  }, []);

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

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
          audio.play().catch(console.error);
          if (audioCtxRef.current?.state === "suspended") {
            audioCtxRef.current.resume();
          }
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
      next: () => {
        nextTrackRef.current();
        if (audioCtxRef.current?.state === "suspended") {
          audioCtxRef.current.resume();
        }
      },
      previous: () => {
        previousRef.current();
        if (audioCtxRef.current?.state === "suspended") {
          audioCtxRef.current.resume();
        }
      },
      seekTo: (time: number) => {
        const audio = audioRef.current;
        if (audio) audio.currentTime = time;
      },
      seekBackward: () => {
        const audio = audioRef.current;
        if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10);
      },
      seekForward: () => {
        const audio = audioRef.current;
        if (audio) audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
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
