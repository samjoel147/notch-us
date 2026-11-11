import type { ReactNode } from "react";

export type MusicProviderId =
	| "spotify"
	| "ytmusic"
	| "youtube"
	| "applemusic"
	| "tidal"
	| "soundcloud"
	| "amazon"
	| "local"
	| "generic";

export type SourceConfidence = "VERIFIED" | "HIGH" | "MEDIUM" | "UNKNOWN";

export interface SourceIdentity {
	providerId: MusicProviderId;
	confidence: SourceConfidence;
	applicationId?: string;
	applicationName?: string;
	playbackDevice?: string;
	isRemotePlayback?: boolean;
	identificationReason?: string;
}

export interface MediaCapabilities {
	canPlay: boolean;
	canPause: boolean;
	canSkipNext: boolean;
	canSkipPrevious: boolean;
	canSeek: boolean;
	canChangeVolume: boolean;
	canShuffle?: boolean;
	canRepeat?: boolean;
	canLike?: boolean;
	canOpenSource?: boolean;
	canOpenVideo?: boolean;
	canControlRemoteDevice?: boolean;
}

export interface UniversalMediaState {
	sessionId: string;
	source: SourceIdentity;
	metadata: {
		title: string;
		artist?: string;
		album?: string;
		artwork?: string | null;
	};
	playback: {
		status: "playing" | "paused" | "stopped";
		position: number;
		duration?: number;
		playbackRate?: number;
		positionAt: number;
	};
	capabilities: MediaCapabilities;
	device?: {
		name?: string;
		type?: string;
		isRemote?: boolean;
	};
	volume?: {
		system?: number;
		app?: number;
		muted?: boolean;
	};
	appIcon?: string | null;
	youtubeId?: string | null;
	updatedAt: number;
}

export interface ProviderBrandDefinition {
	id: MusicProviderId;
	displayName: string;
	brandColor: string;
	secondaryAccent: string;
	glowColor: string;
	badgeBg: string;
	badgeText: string;
	badgeBorder: string;
	renderIcon: (props: { className?: string; size?: number }) => ReactNode;
	defaultCapabilities: Partial<MediaCapabilities>;
}
