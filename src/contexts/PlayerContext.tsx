import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { SubsonicSong, getStreamUrl, getCoverArtUrl } from "../services/subsonicApi";
import { getAudioBackgroundManager } from "../utils/audioBackgroundHandler";

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
  if (!song) return;

  const coverArt = song.coverArt ? getCoverArtUrl(song.coverArt, 512) : undefined;

  const metadata = {
    title: song.title,
    artist: song.artist || "Unknown Artist",
    album: song.album || "Unknown Album",
    artwork: coverArt ? [{ src: coverArt, sizes: "512x512", type: "image/jpeg" }] : ([] as Array<{ src: string; sizes: string; type: string }>),
  };

  // Update native Media Session
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      artwork: metadata.artwork,
    });
  }

  // Update background audio manager
  getAudioBackgroundManager().setupMediaSession(metadata);
}

function setupMediaSessionHandlers(handlers: { play: () => void; pause: () => void; next: () => void; previous: () => void; seekTo: (time: number) => void; seekBackward: () => void; seekForward: () => void }) {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.setActionHandler("play", handlers.play);
  navigator.mediaSession.setActionHandler("pause", handlers.pause);
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
  const bgAudioManagerRef = useRef(
    getAudioBackgroundManager({
      resumePlayback: true,
      keepScreenOn: true,
      enableNotification: true,
    }),
  );

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

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const lastUpdateRef = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator && !wakeLockRef.current) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      } catch (err) {
        console.error("Wake Lock failed", err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  const createAudioElement = useCallback(() => {
    if (audioRef.current) {
      const old = audioRef.current;
      old.pause();
      old.src = "";
      if (document.body.contains(old)) document.body.removeChild(old);
    }

    const audio = new Audio();
    audio.id = "pwa-audio-bridge";
    audio.crossOrigin = "anonymous";
    audio.setAttribute("playsinline", "true");
    audio.setAttribute("webkit-playsinline", "true");
    audio.setAttribute("x-webkit-airplay", "allow");
    audio.setAttribute("controlsList", "nofullscreen");
    audio.preload = "auto";
    audio.title = "CloudBeats Playback";

    audio.style.position = "fixed";
    audio.style.left = "-100px";
    audio.style.top = "-100px";
    audio.style.width = "1px";
    audio.style.height = "1px";
    audio.style.opacity = "1";
    audio.style.pointerEvents = "none";
    audio.style.zIndex = "-1";

    audio.volume = stateRef.current.volume;
    document.body.appendChild(audio);

    // Initialize background audio handling
    bgAudioManagerRef.current.initialize(audio).catch(console.error);

    return audio;
  }, []);

  const initAudioContext = useCallback(() => {
    if (!audioRef.current) return;
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const filters = EQ_FREQUENCIES.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? "lowshelf" : i === EQ_FREQUENCIES.length - 1 ? "highshelf" : "peaking";
        filter.frequency.value = freq;
        filter.gain.value = stateRef.current.eqEnabled ? stateRef.current.eqGains[i] : 0;
        return filter;
      });
      filtersRef.current = filters;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      let lastNode: AudioNode = source;
      filters.forEach((f) => {
        lastNode.connect(f);
        lastNode = f;
      });
      lastNode.connect(ctx.destination);
    } else if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }, []);

  const switchTrackSync = useCallback((song: SubsonicSong, index: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = getStreamUrl(song.id);
    audio.load();
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => console.error("Sync play failed", e));
    }

    updateMediaSession(song);
    bgAudioManagerRef.current.updatePlaybackState("playing");
    setState((s) => ({ ...s, currentSong: song, queueIndex: index, isPlaying: true, currentTime: 0 }));
  }, []);

  const setupListeners = useCallback(
    (el: HTMLAudioElement) => {
      const handlePlayInternal = () => {
        if (audioCtxRef.current?.state === "suspended") {
          audioCtxRef.current.resume();
        } else if (!audioCtxRef.current && stateRef.current.eqEnabled) {
          initAudioContext();
        }
        requestWakeLock();
        bgAudioManagerRef.current.updatePlaybackState("playing");
      };

      el.addEventListener("play", handlePlayInternal);

      el.addEventListener("timeupdate", () => {
        const now = Date.now();
        if (now - lastUpdateRef.current < 250) return;
        lastUpdateRef.current = now;
        setState((s) => ({ ...s, currentTime: el.currentTime, duration: el.duration || 0 }));
        if ("mediaSession" in navigator && !isNaN(el.duration)) {
          navigator.mediaSession.setPositionState({
            duration: el.duration,
            playbackRate: el.playbackRate,
            position: el.currentTime,
          });
          bgAudioManagerRef.current.updatePositionState(el.duration, el.currentTime, el.playbackRate);
        }
      });

      el.addEventListener("ended", () => {
        const { queue, queueIndex, repeatMode, isShuffle } = stateRef.current;
        if (repeatMode === "one") {
          el.currentTime = 0;
          el.play().catch(console.error);
          return;
        }

        let nextIdx = queueIndex + 1;
        if (isShuffle && queue.length > 1) {
          let rand;
          do {
            rand = Math.floor(Math.random() * queue.length);
          } while (rand === queueIndex);
          nextIdx = rand;
        }

        if (nextIdx < queue.length || (repeatMode === "all" && queue.length > 0)) {
          const actualNextIdx = nextIdx < queue.length ? nextIdx : 0;
          switchTrackSync(queue[actualNextIdx], actualNextIdx);
        } else {
          setState((s) => ({ ...s, isPlaying: false }));
          releaseWakeLock();
        }
      });

      el.addEventListener("error", (e) => {
        console.error("Audio error", e);
        if (stateRef.current.isPlaying && stateRef.current.currentSong) {
          setTimeout(() => {
            el.src = getStreamUrl(stateRef.current.currentSong!.id);
            el.load();
            el.play().catch(console.error);
          }, 1000);
        }
      });

      el.addEventListener("play", () => {
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
        bgAudioManagerRef.current.updatePlaybackState("playing");
      });
      el.addEventListener("pause", () => {
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
        bgAudioManagerRef.current.updatePlaybackState("paused");
        releaseWakeLock();
      });
    },
    [initAudioContext, requestWakeLock, releaseWakeLock, switchTrackSync],
  );

  useEffect(() => {
    const audio = createAudioElement();
    if (state.currentSong) {
      audio.src = getStreamUrl(state.currentSong.id);
      audio.currentTime = state.currentTime;
    }
    audioRef.current = audio;
    setupListeners(audio);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (audioCtxRef.current?.state === "suspended" && audioRef.current && !audioRef.current.paused) {
          audioCtxRef.current.resume();
        }
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      audio.pause();
      audio.src = "";
      if (document.body.contains(audio)) document.body.removeChild(audio);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync filter gains when EQ state changes
  useEffect(() => {
    if (state.eqEnabled && state.isPlaying) {
      initAudioContext();
    }

    if (filtersRef.current.length > 0) {
      filtersRef.current.forEach((filter, i) => {
        const targetGain = state.eqEnabled ? state.eqGains[i] : 0;
        filter.gain.setTargetAtTime(targetGain, audioCtxRef.current?.currentTime || 0, 0.1);
      });
    }
  }, [state.eqEnabled, state.eqGains, state.isPlaying, initAudioContext]);

  const playSong = useCallback((song: SubsonicSong, queue?: SubsonicSong[]) => {
    const newQueue = queue || [song];
    const idx = newQueue.findIndex((s) => s.id === song.id);
    setState((s) => ({ ...s, currentSong: song, queue: newQueue, queueIndex: idx >= 0 ? idx : 0, isPlaying: true, currentTime: 0 }));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentSong) return;

    const streamUrl = getStreamUrl(state.currentSong.id);
    if (audio.src !== streamUrl) {
      audio.pause();
      audio.src = streamUrl;
      audio.load();
      if (state.currentTime > 0) audio.currentTime = state.currentTime;
      updateMediaSession(state.currentSong);
    }

    if (state.isPlaying) {
      audio.volume = state.volume;
      audio.play().catch(console.error);
      if (state.eqEnabled) {
        initAudioContext();
        if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
      }
    } else {
      audio.pause();
    }
  }, [state.currentSong?.id, state.isPlaying]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentSong) return;
    if (audio.paused) {
      audio.play().catch(console.error);
      setState((s) => ({ ...s, isPlaying: true }));
      if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
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
      if (nextIdx < prev.queue.length) return { ...prev, currentSong: prev.queue[nextIdx], queueIndex: nextIdx, isPlaying: true, currentTime: 0 };
      if (prev.repeatMode === "all" && prev.queue.length > 0) return { ...prev, currentSong: prev.queue[0], queueIndex: 0, isPlaying: true, currentTime: 0 };
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
      if (prevIdx >= 0) return { ...prev, currentSong: prev.queue[prevIdx], queueIndex: prevIdx, isPlaying: true, currentTime: 0 };
      return prev;
    });
  }, []);

  useEffect(() => {
    const { currentSong, queue, queueIndex, volume, currentTime, isShuffle, repeatMode, eqEnabled, eqPreset, eqGains } = state;
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify({ currentSong, queue, queueIndex, volume, currentTime, isShuffle, repeatMode, eqEnabled, eqPreset, eqGains }));
  }, [state.currentSong, state.queue, state.queueIndex, state.volume, state.isShuffle, state.repeatMode, state.eqEnabled, state.eqPreset, state.eqGains]);

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

  useEffect(() => {
    setupMediaSessionHandlers({
      play: () => {
        const audio = audioRef.current;
        if (audio) {
          audio.play().catch(console.error);
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
        const { queue, queueIndex, repeatMode, isShuffle } = stateRef.current;
        let nextIdx = queueIndex + 1;
        if (isShuffle && queue.length > 1) {
          let rand;
          do {
            rand = Math.floor(Math.random() * queue.length);
          } while (rand === queueIndex);
          nextIdx = rand;
        }
        if (nextIdx < queue.length || (repeatMode === "all" && queue.length > 0)) {
          const actualNextIdx = nextIdx < queue.length ? nextIdx : 0;
          switchTrackSync(queue[actualNextIdx], actualNextIdx);
        }
      },
      previous: () => {
        const { queue, queueIndex } = stateRef.current;
        const audio = audioRef.current;
        if (audio && audio.currentTime > 3) {
          audio.currentTime = 0;
          return;
        }
        const prevIdx = queueIndex - 1;
        if (prevIdx >= 0) switchTrackSync(queue[prevIdx], prevIdx);
      },
      seekTo: (time: number) => {
        if (audioRef.current) audioRef.current.currentTime = time;
      },
      seekBackward: () => {
        if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
      },
      seekForward: () => {
        if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 10);
      },
    });
  }, [switchTrackSync]);

  const toggleEq = useCallback(() => {
    setState((s) => {
      const nextEq = !s.eqEnabled;
      if (!nextEq && audioRef.current) {
        const audio = audioRef.current;
        const song = s.currentSong;
        const time = audio.currentTime;
        const playing = !audio.paused;
        const newAudio = createAudioElement();
        if (song) {
          newAudio.src = getStreamUrl(song.id);
          newAudio.currentTime = time;
          if (playing) newAudio.play().catch(console.error);
        }
        audioRef.current = newAudio;
        setupListeners(newAudio);
      }
      return { ...s, eqEnabled: nextEq };
    });
  }, [createAudioElement, setupListeners]);

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        playSong,
        togglePlay,
        next: nextTrack,
        previous,
        seek: (t) => {
          if (audioRef.current) audioRef.current.currentTime = t;
        },
        setVolume: (v) => {
          if (audioRef.current) audioRef.current.volume = v;
          setState((s) => ({ ...s, volume: v }));
        },
        setNowPlayingOpen: (o) => setState((s) => ({ ...s, isNowPlayingOpen: o })),
        toggleShuffle: () => setState((s) => ({ ...s, isShuffle: !s.isShuffle })),
        toggleRepeat: () =>
          setState((s) => {
            const modes: RepeatMode[] = ["none", "all", "one"];
            return { ...s, repeatMode: modes[(modes.indexOf(s.repeatMode) + 1) % modes.length] };
          }),
        coverUrl: (id) => (id ? getCoverArtUrl(id) : ""),
        toggleEq,
        setEqPreset: (p) => {
          if (p === "custom") setState((s) => ({ ...s, eqPreset: "custom" }));
          else if (EQ_PRESETS[p]) setState((s) => ({ ...s, eqPreset: p, eqGains: EQ_PRESETS[p] }));
        },
        setEqGain: (i, g) =>
          setState((s) => {
            const newGains = [...s.eqGains];
            newGains[i] = g;
            return { ...s, eqGains: newGains, eqPreset: "custom" };
          }),
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
