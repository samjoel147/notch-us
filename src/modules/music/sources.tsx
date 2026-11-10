import type { ReactNode } from "react";
import type { MusicState } from "./hooks/useMusic";

export type MusicSourceId =
	| "spotify"
	| "ytmusic"
	| "youtube"
	| "applemusic"
	| "tidal"
	| "soundcloud"
	| "amazon"
	| "generic";

export interface MusicSourceDef {
	id: MusicSourceId;
	name: string;
	brandColor: string;
	glowColor: string;
	badgeBg: string;
	badgeText: string;
	badgeBorder: string;
	renderIcon: (props: { className?: string; size?: number }) => ReactNode;
}

/** Vector SVG icons for popular streaming services. */
export const SOURCE_DEFS: Record<MusicSourceId, MusicSourceDef> = {
	spotify: {
		id: "spotify",
		name: "Spotify",
		brandColor: "#1ed760",
		glowColor: "rgba(30, 215, 96, 0.45)",
		badgeBg: "rgba(30, 215, 96, 0.14)",
		badgeText: "#1ed760",
		badgeBorder: "rgba(30, 215, 96, 0.32)",
		renderIcon: ({ className, size = 13 }) => (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
				<path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.792-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.502 9.72 1.113.295.18.388.563.208.857zm1.226-2.723c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.127-.848-.106-.973-.518-.127-.414.106-.849.518-.974 3.632-1.102 8.147-.568 11.235 1.33.366.225.481.706.257 1.071zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.494.15-1.017-.129-1.167-.623-.15-.494.13-1.017.624-1.167 3.532-1.072 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.444-.838.59-1.28.327z" />
			</svg>
		),
	},
	ytmusic: {
		id: "ytmusic",
		name: "YouTube Music",
		brandColor: "#ff0033",
		glowColor: "rgba(255, 0, 51, 0.45)",
		badgeBg: "rgba(255, 0, 51, 0.14)",
		badgeText: "#ff3344",
		badgeBorder: "rgba(255, 0, 51, 0.32)",
		renderIcon: ({ className, size = 13 }) => (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
				<circle cx="12" cy="12" r="10" />
				<circle cx="12" cy="12" r="6" fill="#000" fillOpacity="0.4" />
				<polygon points="10,8.5 16,12 10,15.5" fill="#fff" />
			</svg>
		),
	},
	youtube: {
		id: "youtube",
		name: "YouTube",
		brandColor: "#ff0000",
		glowColor: "rgba(255, 0, 0, 0.42)",
		badgeBg: "rgba(255, 0, 0, 0.14)",
		badgeText: "#ff4444",
		badgeBorder: "rgba(255, 0, 0, 0.32)",
		renderIcon: ({ className, size = 13 }) => (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
				<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
			</svg>
		),
	},
	applemusic: {
		id: "applemusic",
		name: "Apple Music",
		brandColor: "#fa2d48",
		glowColor: "rgba(250, 45, 72, 0.45)",
		badgeBg: "rgba(250, 45, 72, 0.14)",
		badgeText: "#fa3e57",
		badgeBorder: "rgba(250, 45, 72, 0.32)",
		renderIcon: ({ className, size = 13 }) => (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
				<path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm4.5 5.5v5.882a2.618 2.618 0 1 1-1.5-2.373V8.895l-5 1.154v4.333a2.618 2.618 0 1 1-1.5-2.373V8.5a.75.75 0 0 1 .586-.732l6.5-1.5a.75.75 0 0 1 .914.732z" />
			</svg>
		),
	},
	tidal: {
		id: "tidal",
		name: "TIDAL",
		brandColor: "#00f0ff",
		glowColor: "rgba(0, 240, 255, 0.42)",
		badgeBg: "rgba(0, 240, 255, 0.12)",
		badgeText: "#00f0ff",
		badgeBorder: "rgba(0, 240, 255, 0.3)",
		renderIcon: ({ className, size = 13 }) => (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
				<path d="M4.004 7.996 0 12l4.004 4.004L8.008 12 4.004 7.996zm7.996 0L8.004 12l3.996 4.004L16 12l-4-4.004zm0-7.996L8.004 4l3.996 4.004L16 4 12 0zm7.996 7.996L16 12l4 4.004L24 12l-4.004-4.004z" />
			</svg>
		),
	},
	soundcloud: {
		id: "soundcloud",
		name: "SoundCloud",
		brandColor: "#ff5500",
		glowColor: "rgba(255, 85, 0, 0.42)",
		badgeBg: "rgba(255, 85, 0, 0.14)",
		badgeText: "#ff661a",
		badgeBorder: "rgba(255, 85, 0, 0.32)",
		renderIcon: ({ className, size = 13 }) => (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
				<path d="M11.56 8.87V17h9.07c1.86 0 3.37-1.51 3.37-3.37 0-1.8-1.42-3.27-3.2-3.36-.26-2.58-2.43-4.6-5.06-4.6-1.54 0-2.92.69-3.86 1.77-.1-.2-.21-.38-.32-.57zM8.88 10.45v6.55h1.34v-6.72c-.44.06-.89.11-1.34.17zm-2.68 1.05v5.5h1.34v-5.74c-.45.08-.89.16-1.34.24zm-2.68 1.4v4.1h1.34V12.5c-.45.13-.89.27-1.34.4zm-2.68 1.83v2.27h1.34V14.5c-.45.07-.89.15-1.34.23z" />
			</svg>
		),
	},
	amazon: {
		id: "amazon",
		name: "Amazon Music",
		brandColor: "#00a8e1",
		glowColor: "rgba(0, 168, 225, 0.42)",
		badgeBg: "rgba(0, 168, 225, 0.14)",
		badgeText: "#00b4f0",
		badgeBorder: "rgba(0, 168, 225, 0.32)",
		renderIcon: ({ className, size = 13 }) => (
			<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c-2.4 0-4.6-1-5.9-2.6-.2-.3-.2-.7.1-.9.3-.2.7-.2.9.1 1.1 1.3 2.9 2.1 4.9 2.1 2.2 0 4.2-1 5.3-2.5.2-.3.7-.4.9-.1.3.2.4.7.1.9-1.4 1.8-3.7 3-6.3 3zm3.5-5.2c-.3.4-.8.5-1.2.2-.8-.6-1.9-1-3.3-1s-2.5.4-3.3 1c-.4.3-.9.2-1.2-.2-.3-.4-.2-.9.2-1.2 1.1-.9 2.6-1.3 4.3-1.3s3.2.4 4.3 1.3c.4.3.5.8.2 1.2z" />
			</svg>
		),
	},
	generic: {
		id: "generic",
		name: "Media Player",
		brandColor: "#8b92ff",
		glowColor: "rgba(139, 146, 255, 0.38)",
		badgeBg: "rgba(255, 255, 255, 0.08)",
		badgeText: "var(--text-dim)",
		badgeBorder: "rgba(255, 255, 255, 0.14)",
		renderIcon: ({ className, size = 13 }) => (
			<svg
				width={size}
				height={size}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className={className}
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="10" />
				<polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
			</svg>
		),
	},
};

/**
 * Identifies the streaming provider from MusicState properties:
 * - App ID (e.g. Spotify.exe, AppleMusic, etc.)
 * - App Name (Spotify, Chrome, Edge, etc.)
 * - YouTube Video ID detection
 * - Track/Artist metadata cues
 */
export function detectMusicSource(music: MusicState | undefined): MusicSourceDef {
	if (!music) return SOURCE_DEFS.generic;

	const appId = (music.appId || "").toLowerCase();
	const appName = (music.appName || "").toLowerCase();
	const title = (music.title || "").toLowerCase();
	const artist = (music.artist || "").toLowerCase();
	const album = (music.album || "").toLowerCase();

	// 1. Spotify
	if (appId.includes("spotify") || appName.includes("spotify") || music.appDevice) {
		return SOURCE_DEFS.spotify;
	}

	// 2. YouTube Music (Web or Desktop PWA)
	if (
		title.includes("youtube music") ||
		artist.includes("youtube music") ||
		album.includes("youtube music") ||
		appName.includes("youtube music") ||
		appId.includes("music.youtube")
	) {
		return SOURCE_DEFS.ytmusic;
	}

	// 3. YouTube (identified video mirror or browser title)
	if (music.youtubeId || title.includes("youtube") || appName.includes("youtube")) {
		return SOURCE_DEFS.youtube;
	}

	// 4. Apple Music / iTunes
	if (
		appId.includes("applemusic") ||
		appName.includes("apple music") ||
		appId.includes("itunes") ||
		appName.includes("itunes")
	) {
		return SOURCE_DEFS.applemusic;
	}

	// 5. TIDAL
	if (appId.includes("tidal") || appName.includes("tidal")) {
		return SOURCE_DEFS.tidal;
	}

	// 6. SoundCloud
	if (appId.includes("soundcloud") || appName.includes("soundcloud") || title.includes("soundcloud")) {
		return SOURCE_DEFS.soundcloud;
	}

	// 7. Amazon Music
	if (appId.includes("amazonmusic") || appName.includes("amazon music")) {
		return SOURCE_DEFS.amazon;
	}

	// Fallback: return generic with custom app name if available
	if (music.appName && music.appName !== "Unknown") {
		return {
			...SOURCE_DEFS.generic,
			name: music.appName,
		};
	}

	return SOURCE_DEFS.generic;
}
