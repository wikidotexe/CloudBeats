# PWA Background Audio Playback Fix

## Overview

This document describes the fixes applied to enable background audio playback for the CloudBeats PWA on iOS and Android devices.

## Problem

The PWA was unable to play music in the background on iOS and Android devices. When the user navigated away from the app or locked their phone, audio playback would stop.

## Root Causes

1. **Missing Media Session API integration** - The Media Session API w as not properly configured for background control
2. **iOS/Android audio context suspension** - When the app goes into the background, the audio context gets suspended
3. **Incorrect audio element attributes** - Missing iOS-specific attributes for airplay and playsinline support
4. **Service worker caching strategy** - Audio streams weren't properly cached for offline/background playback
5. **Missing manifest configuration** - The PWA manifest didn't declare audio/media capabilities

## Implemented Solutions

### 1. Audio Background Handler (`src/utils/audioBackgroundHandler.ts`)

Created a new utility class that manages background audio playback:

- **Wake Lock Management**: Requests and manages the Screen Wake Lock API to keep the screen on during playback
- **Background Lifecycle Handling**: Uses `pagehide`/`pageshow` events to detect when app goes to background and ensures playback continues
- **Media Session Setup**: Properly configures the Media Session API with metadata and playback state
- **iOS-specific Handling**: Applies iOS-specific setup for audio context and airplay support

**Key Features:**

```typescript
- requestWakeLock() - Keeps screen on during playback
- releaseWakeLock() - Releases wake lock when not playing
- updatePlaybackState() - Syncs playback state with OS controls
- updatePositionState() - Updates seek position for remote controls
- handleIOSSpecificSetup() - Handles iOS audio constraints
```

### 2. HTML Meta Tags & Icons (`index.html`)

Added critical meta tags for PWA and iOS support:

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="CloudBeats" />
<meta name="theme-color" content="#0d1117" />
<meta name="viewport" content="viewport-fit=cover" />
```

These enable:

- Proper PWA installation on iOS
- Status bar styling
- Viewport adaptation for notched devices

### 3. Web App Manifest (`public/manifest.webmanifest`)

Enhanced manifest with:

- **Categories**: Added `music` and `multimedia` categories
- **Shortcuts**: Added "Play Music" quick action for faster access
- **Purpose Declaration**: Properly declared icon purposes (`any maskable`)
- **Display Mode**: Standalone mode for full-screen experience

### 4. Audio Element Enhancements (`src/contexts/PlayerContext.tsx`)

Updated audio element creation with iOS/Android specific attributes:

```typescript
audio.setAttribute("playsinline", "true"); // iOS inline playback
audio.setAttribute("webkit-playsinline", "true"); // Webkit fallback
audio.setAttribute("x-webkit-airplay", "allow"); // AirPlay support
audio.setAttribute("controlsList", "nofullscreen");
```

### 5. Media Session API Integration

Enhanced Media Session setup to properly handle:

- Playback controls (play, pause, next, previous)
- Seek operations
- Position state updates (for progress bars on lock screen)
- Metadata display (title, artist, album, artwork)

### 6. Service Worker Configuration (`vite.config.ts`)

Improved Workbox caching strategies:

**Audio Streams** - Stale While Revalidate:

```typescript
handler: "StaleWhileRevalidate",
cacheName: "audio-streams",
maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
```

**Cover Art** - Cache First:

```typescript
handler: "CacheFirst",
cacheName: "cover-art-cache",
maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
```

**API Calls** - Stale While Revalidate:

```typescript
handler: "StaleWhileRevalidate",
cacheName: "api-cache",
maxAgeSeconds: 60 * 60 // 1 hour
```

This ensures:

- Audio can be played offline once cached
- Background sync can work if service worker has cached content
- Efficient bandwidth usage with cache fallback

### 7. App Initialization (`src/main.tsx`)

Added service worker registration and iOS audio context initialization:

- Service worker auto-registration on page load
- iOS-specific audio context initialization on first touch to comply with iOS audio policies

## How It Works

### iOS Playback Flow

1. User taps play button (required for iOS audio policy)
2. Audio context is created and resumed
3. Audio element starts playing with proper attributes
4. MediaSession API updates OS media controls
5. When app goes to background:
   - `pagehide` event is triggered
   - Background audio handler keeps track of playback state
   - Audio continues playing in background
   - OS controls remain available
6. When app returns to foreground:
   - `pageshow` event resumes if needed
   - Audio context is resumed if suspended

### Android Playback Flow

1. Similar to iOS but with fewer restrictions
2. Service Worker can keep content cached for background playback
3. OS handles media playback permission through manifest declaration

## Browser Support

| Feature             | iOS | Android | Desktop |
| ------------------- | --- | ------- | ------- |
| Background Playback | ✅  | ✅      | ✅      |
| Media Session API   | ✅  | ✅      | ✅      |
| Wake Lock           | ✅  | ✅      | ✅      |
| Service Worker      | ✅  | ✅      | ✅      |
| AirPlay             | ✅  | N/A     | N/A     |

## Testing Recommendations

### iOS Testing

1. Install app as PWA (add to home screen)
2. Play a song
3. Press home button or lock phone
4. Music should continue playing
5. Double-tap home to access media controls
6. Use lock screen controls to pause/play/skip

### Android Testing

1. Install app as PWA (add to home screen)
2. Play a song
3. Press home button or navigate away
4. Music should continue playing
5. Pull down notification shade to see media controls
6. Use notification controls to manage playback

### Desktop Testing

1. Open in browser
2. Play music
3. Switch tabs or other applications
4. Music should continue in background
5. Use media key controls (if supported)

## Files Modified

1. ✅ `src/utils/audioBackgroundHandler.ts` - NEW
2. ✅ `public/manifest.webmanifest` - UPDATED
3. ✅ `index.html` - UPDATED
4. ✅ `src/contexts/PlayerContext.tsx` - UPDATED
5. ✅ `src/main.tsx` - UPDATED
6. ✅ `vite.config.ts` - UPDATED

## Troubleshooting

### Audio stops when app goes to background

- Check if wake lock is being requested
- Verify Media Session handlers are set
- Check browser console for errors

### Lock screen controls don't work

- Ensure Media Session metadata is being set
- Check that handler functions are properly connected
- Test in standalone PWA mode (not browser)

### AirPlay not working on iOS

- Audio must be playing before AirPlay appears
- Check that x-webkit-airplay attribute is set
- Ensure audio element is in DOM

### Service worker not caching audio

- Check Workbox cache configuration
- Verify audio URLs match cache patterns
- Check Application > Service Workers in DevTools

## Future Improvements

1. **Background Sync**: Queue next track in service worker
2. **Persistent Playback**: Keep track of playback position across app restarts
3. **Bluetooth Controls**: Support for Bluetooth media buttons
4. **Notification API**: Show persistent notification with playback controls
5. **Ambient Display Support**: Show player on lock screen without user interaction

## References

- [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession)
- [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Audio Best Practices](https://web.dev/media-engagement/)
