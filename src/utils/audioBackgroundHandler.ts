/**
 * Audio Background Handler
 * Handles background audio playback for PWA on iOS and Android
 * Ensures audio context is not suspended when the app goes into the background
 */

interface BackgroundAudioConfig {
  resumePlayback?: boolean;
  keepScreenOn?: boolean;
  enableNotification?: boolean;
}

class AudioBackgroundManager {
  private wakeLockSentinel: any = null;
  private audioElement: HTMLAudioElement | null = null;
  private pageHideHandler: (() => void) | null = null;
  private pageShowHandler: (() => void) | null = null;
  private config: BackgroundAudioConfig;

  constructor(config: BackgroundAudioConfig = {}) {
    this.config = {
      resumePlayback: true,
      keepScreenOn: true,
      enableNotification: true,
      ...config,
    };
  }

  /**
   * Initialize background audio handling
   */
  async initialize(audioElement: HTMLAudioElement) {
    this.audioElement = audioElement;
    await this.setupAudioElement();
    this.attachEventListeners();
    this.handleIOSSpecificSetup();
  }

  /**
   * Setup audio element with proper attributes for background playback
   */
  private async setupAudioElement() {
    if (!this.audioElement) return;

    // Ensure CORS is set
    this.audioElement.crossOrigin = "anonymous";

    // iOS-specific attributes
    this.audioElement.setAttribute("playsinline", "true");
    this.audioElement.setAttribute("webkit-playsinline", "true");
    this.audioElement.setAttribute("x-webkit-airplay", "allow");

    // Android-specific
    this.audioElement.setAttribute("controlsList", "nofullscreen");
  }

  /**
   * Handle iOS-specific setup
   */
  private handleIOSSpecificSetup() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (isIOS) {
      // iOS requires user interaction to enable audio
      // This is handled by the play button click in the UI

      // Prevent page from sleeping during audio playback
      if ("wakeLock" in navigator) {
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible" && this.isPlaying()) {
            this.requestWakeLock();
          }
        });
      }
    }
  }

  /**
   * Attach event listeners for background audio handling
   */
  private attachEventListeners() {
    if (!this.audioElement) return;

    this.pageHideHandler = () => {
      // Page is being hidden, but we want audio to continue
      // The audio context will be suspended by iOS/Android
      // but we need to keep track that playback should resume
      if ("mediaSession" in navigator && this.isPlaying()) {
        navigator.mediaSession.playbackState = "playing";
      }
    };

    this.pageShowHandler = async () => {
      // Page is back in focus, resume if needed
      if (this.config.resumePlayback && this.isPlaying()) {
        // Resume audio context if it was suspended
        if (this.audioElement && this.audioElement.paused) {
          try {
            await this.audioElement.play();
          } catch (e) {
            console.error("Failed to resume audio on page show", e);
          }
        }

        // Request wake lock again
        if (this.config.keepScreenOn) {
          await this.requestWakeLock();
        }
      }
    };

    // Use pagehide/pageshow for better background handling
    window.addEventListener("pagehide", this.pageHideHandler);
    window.addEventListener("pageshow", this.pageShowHandler);

    // Also listen to visibility change
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.pageHideHandler?.();
      } else {
        this.pageShowHandler?.();
      }
    });
  }

  /**
   * Request wake lock to keep screen on during playback
   */
  async requestWakeLock() {
    if (!("wakeLock" in navigator)) return;

    try {
      if (!this.wakeLockSentinel) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request("screen");

        this.wakeLockSentinel.addEventListener("release", () => {
          this.wakeLockSentinel = null;
        });
      }
    } catch (err) {
      console.warn("Wake lock request failed", err);
    }
  }

  /**
   * Release wake lock
   */
  async releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        await this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      } catch (err) {
        console.warn("Wake lock release failed", err);
      }
    }
  }

  /**
   * Check if audio is currently playing
   */
  private isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false;
  }

  /**
   * Setup Media Session API for background controls
   */
  setupMediaSession(metadata: { title: string; artist: string; album: string; artwork?: Array<{ src: string; sizes: string; type: string }> }) {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      artwork: metadata.artwork || [],
    });
  }

  /**
   * Update media session playback state
   */
  updatePlaybackState(state: "playing" | "paused" | "none") {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  }

  /**
   * Update media session position for seek bar
   */
  updatePositionState(duration: number, position: number, playbackRate: number = 1) {
    if ("mediaSession" in navigator && !isNaN(duration)) {
      navigator.mediaSession.setPositionState({
        duration,
        position,
        playbackRate,
      });
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.pageHideHandler) {
      window.removeEventListener("pagehide", this.pageHideHandler);
    }
    if (this.pageShowHandler) {
      window.removeEventListener("pageshow", this.pageShowHandler);
    }
    this.releaseWakeLock();
  }
}

// Export singleton
let instance: AudioBackgroundManager | null = null;

export function getAudioBackgroundManager(config?: BackgroundAudioConfig): AudioBackgroundManager {
  if (!instance) {
    instance = new AudioBackgroundManager(config);
  }
  return instance;
}

export { AudioBackgroundManager };
