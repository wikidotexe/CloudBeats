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

// Simple MD5 implementation for Subsonic token generation
function md5(string: string) {
  function md5cycle(x: any, k: any) {
    var a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }
  function cmn(q: any, a: any, b: any, x: any, s: any, t: any) {
    a = add32(a, add32(add32(q, x), t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }
  function gg(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }
  function hh(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
  }
  function md51(s: any) {
    var txt = "";
    var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
    for (i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i++)
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  function md5blk(s: any) {
    var md5blks = [], i;
    for (i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  var hex_chr = "0123456789abcdef".split("");
  function rhex(n: any) {
    var s = "", j = 0;
    for (; j < 4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
    return s;
  }
  function add32(a: any, b: any) {
    return (a + b) & 0xFFFFFFFF;
  }
  return rhex(md51(string)[0]) + rhex(md51(string)[1]) + rhex(md51(string)[2]) + rhex(md51(string)[3]);
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
  const salt = Math.random().toString(36).substring(2, 10);
  const token = md5(config.password + salt);

  return new URLSearchParams({
    u: config.username,
    t: token,
    s: salt,
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
