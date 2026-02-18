// Subsonic API service

export interface SubsonicConfig {
  server: string;
  username: string;
  password: string;
}

export interface SubsonicArtist {
  id: string;
  name: string;
  albumCount?: number;
  coverArt?: string;
}

export interface SubsonicAlbum {
  id: string;
  name: string;
  artist: string;
  artistId?: string;
  coverArt?: string;
  songCount: number;
  duration: number;
  year?: number;
  genre?: string;
}

export interface SubsonicSong {
  id: string;
  title: string;
  album?: string;
  albumId?: string;
  artist?: string;
  artistId?: string;
  track?: number;
  duration?: number;
  coverArt?: string;
  suffix?: string;
  contentType?: string;
}

const STORAGE_KEY = "_sb_c_"; // Obfuscated key

function getConfig(): SubsonicConfig | null {
  try {
    let stored = localStorage.getItem(STORAGE_KEY);

    // Migration: If new key doesn't exist but old one does, migrate it
    if (!stored) {
      const oldConfig = localStorage.getItem("subsonic-config");
      if (oldConfig) {
        try {
          const parsed = JSON.parse(oldConfig);
          saveConfig(parsed); // This will save to the new key in Base64
          localStorage.removeItem("subsonic-config");
          stored = localStorage.getItem(STORAGE_KEY);
        } catch (e) {
          localStorage.removeItem("subsonic-config");
        }
      }
    }

    if (!stored) return null;
    // Decode from Base64
    const decoded = atob(stored);
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

export function saveConfig(config: SubsonicConfig) {
  // Encode to Base64
  const encoded = btoa(JSON.stringify(config));
  localStorage.setItem(STORAGE_KEY, encoded);
}

export function getStoredConfig(): SubsonicConfig | null {
  return getConfig();
}

export function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("subsonic-config"); // Cleanup old key if exists
}

function buildParams(config: SubsonicConfig): URLSearchParams {
  return new URLSearchParams({
    u: config.username,
    p: config.password,
    v: "1.16.1",
    c: "LovablePlayer",
    f: "json",
  });
}

function baseUrl(config: SubsonicConfig): string {
  let server = config.server.replace(/\/+$/, "");
  if (!server.endsWith("/rest")) {
    server += "/rest";
  }
  return server;
}

async function apiCall<T>(endpoint: string, extraParams?: Record<string, string>): Promise<T> {
  const config = getConfig();
  if (!config) throw new Error("Not configured");

  const params = buildParams(config);
  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
  }

  const url = `${baseUrl(config)}/${endpoint}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();

  const subRes = data["subsonic-response"];
  if (!subRes || subRes.status !== "ok") {
    throw new Error(subRes?.error?.message || "API error");
  }
  return subRes;
}

export async function ping(): Promise<boolean> {
  try {
    await apiCall("ping");
    return true;
  } catch {
    return false;
  }
}

export async function getArtists(): Promise<SubsonicArtist[]> {
  const res = await apiCall<any>("getArtists");
  const indexes = res.artists?.index || [];
  const artists: SubsonicArtist[] = [];
  for (const idx of indexes) {
    if (idx.artist) {
      artists.push(...(Array.isArray(idx.artist) ? idx.artist : [idx.artist]));
    }
  }
  return artists;
}

export async function getAlbumList(type: string = "newest", size: number = 30): Promise<SubsonicAlbum[]> {
  const res = await apiCall<any>("getAlbumList2", { type, size: String(size) });
  return res.albumList2?.album || [];
}

export async function getAlbum(id: string): Promise<{ album: SubsonicAlbum; songs: SubsonicSong[] }> {
  const res = await apiCall<any>("getAlbum", { id });
  const album = res.album;
  const songs = album?.song || [];
  return { album, songs };
}

export async function search(query: string): Promise<{ artists: SubsonicArtist[]; albums: SubsonicAlbum[]; songs: SubsonicSong[] }> {
  const res = await apiCall<any>("search3", { query, artistCount: "10", albumCount: "10", songCount: "20" });
  return {
    artists: res.searchResult3?.artist || [],
    albums: res.searchResult3?.album || [],
    songs: res.searchResult3?.song || [],
  };
}

export async function getRandomSongs(size: number = 50): Promise<SubsonicSong[]> {
  const res = await apiCall<any>("getRandomSongs", { size: String(size) });
  return res.randomSongs?.song || [];
}


export async function getPlaylists(): Promise<{ id: string; name: string; songCount: number; duration: number; coverArt?: string }[]> {
  const res = await apiCall<any>("getPlaylists");
  return res.playlists?.playlist || [];
}

export async function getPlaylist(id: string): Promise<{ id: string; name: string; songs: SubsonicSong[] }> {
  const res = await apiCall<any>("getPlaylist", { id });
  return {
    id: res.playlist?.id,
    name: res.playlist?.name,
    songs: res.playlist?.entry || [],
  };
}

export function getStreamUrl(songId: string): string {
  const config = getConfig();
  if (!config) return "";
  const params = buildParams(config);
  params.set("id", songId);
  params.set("estimateContentLength", "true");
  // Suggest a reasonable bitrate for streaming if supported by server
  // params.set("maxBitRate", "320"); 
  return `${baseUrl(config)}/stream?${params.toString()}`;
}

export function getCoverArtUrl(coverArtId: string, size: number = 300): string {
  const config = getConfig();
  if (!config) return "";
  const params = buildParams(config);
  params.set("id", coverArtId);
  params.set("size", String(size));
  return `${baseUrl(config)}/getCoverArt?${params.toString()}`;
}
