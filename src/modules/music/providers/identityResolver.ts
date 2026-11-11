import type { MusicState } from "../hooks/useMusic";
import type { SourceIdentity } from "./types";

interface CacheEntry {
	key: string;
	identity: SourceIdentity;
	timestamp: number;
}

const CACHE_TTL_MS = 60_000;
const identityCache = new Map<string, CacheEntry>();

export function resolveSourceIdentity(music: MusicState | undefined): SourceIdentity {
	if (!music?.available) {
		return {
			providerId: "generic",
			confidence: "UNKNOWN",
			identificationReason: "No active media session",
		};
	}

	const cacheKey = `${music.appId}|${music.appName}|${music.youtubeId ?? ""}|${music.appDevice ?? ""}`;
	const cached = identityCache.get(cacheKey);
	const now = Date.now();
	if (cached && now - cached.timestamp < CACHE_TTL_MS) {
		return cached.identity;
	}

	const identity = computeIdentity(music);
	identityCache.set(cacheKey, {
		key: cacheKey,
		identity,
		timestamp: now,
	});

	return identity;
}

function computeIdentity(music: MusicState): SourceIdentity {
	const appId = (music.appId || "").toLowerCase();
	const appName = (music.appName || "").toLowerCase();

	// 1. Spotify — Verified AUMID, executable, or Spotify Connect device
	if (appId.includes("spotify") || appName.includes("spotify") || music.appDevice) {
		return {
			providerId: "spotify",
			confidence: "VERIFIED",
			applicationId: music.appId,
			applicationName: "Spotify",
			playbackDevice: music.appDevice ?? undefined,
			isRemotePlayback: !!music.appDevice,
			identificationReason: music.appDevice ? "Verified Spotify Connect session" : "Verified Spotify application",
		};
	}

	// 2. YouTube Music — Distinct PWA AUMID or verified window identity
	// YouTube Music desktop/PWA has app ID like "msedge_music.youtube.com" or "chrome-music.youtube.com"
	if (
		appId.includes("music.youtube") ||
		appName.includes("youtube music") ||
		(isBrowser(appName) && appId.includes("music.youtube"))
	) {
		return {
			providerId: "ytmusic",
			confidence: "HIGH",
			applicationId: music.appId,
			applicationName: "YouTube Music",
			identificationReason: "Verified YouTube Music web app or PWA package",
		};
	}

	// 3. YouTube (Video mirror or browser identified video)
	if (music.youtubeId || (isBrowser(appName) && appName.includes("youtube"))) {
		return {
			providerId: "youtube",
			confidence: music.youtubeId ? "HIGH" : "MEDIUM",
			applicationId: music.appId,
			applicationName: "YouTube",
			identificationReason: music.youtubeId ? "Resolved YouTube video stream" : "Browser YouTube media session",
		};
	}

	// 4. Apple Music / iTunes (Native Windows package / desktop client)
	if (
		appId.includes("applemusic") ||
		appName.includes("apple music") ||
		appId.includes("itunes") ||
		appName.includes("itunes")
	) {
		return {
			providerId: "applemusic",
			confidence: "VERIFIED",
			applicationId: music.appId,
			applicationName: "Apple Music",
			identificationReason: "Verified Apple Music Windows application or iTunes package",
		};
	}

	// 5. TIDAL
	if (appId.includes("tidal") || appName.includes("tidal")) {
		return {
			providerId: "tidal",
			confidence: "HIGH",
			applicationId: music.appId,
			applicationName: "TIDAL",
			identificationReason: "Verified TIDAL desktop player",
		};
	}

	// 6. SoundCloud
	if (appId.includes("soundcloud") || appName.includes("soundcloud")) {
		return {
			providerId: "soundcloud",
			confidence: "HIGH",
			applicationId: music.appId,
			applicationName: "SoundCloud",
			identificationReason: "SoundCloud desktop client or PWA",
		};
	}

	// 7. Amazon Music
	if (appId.includes("amazonmusic") || appName.includes("amazon music")) {
		return {
			providerId: "amazon",
			confidence: "HIGH",
			applicationId: music.appId,
			applicationName: "Amazon Music",
			identificationReason: "Amazon Music desktop application",
		};
	}

	// 8. Local Media (VLC, Windows Media Player, Zune Music, Foobar2000, AIMP, MPC-HC)
	if (
		appId.includes("vlc") ||
		appId.includes("wmplayer") ||
		appId.includes("zunemusic") ||
		appId.includes("foobar") ||
		appId.includes("aimp") ||
		appName.includes("media player") ||
		appName.includes("vlc")
	) {
		return {
			providerId: "local",
			confidence: "VERIFIED",
			applicationId: music.appId,
			applicationName: music.appName || "Local Media Player",
			identificationReason: "Local media player process",
		};
	}

	// 9. Generic Fallback
	const displayApp = music.appName && music.appName !== "Unknown" ? music.appName : undefined;
	return {
		providerId: "generic",
		confidence: displayApp ? "MEDIUM" : "UNKNOWN",
		applicationId: music.appId,
		applicationName: displayApp,
		identificationReason: "Standard Windows SMTC media session",
	};
}

function isBrowser(appName: string): boolean {
	const browsers = ["chrome", "edge", "brave", "firefox", "opera", "vivaldi", "arc"];
	return browsers.some((b) => appName.includes(b));
}
