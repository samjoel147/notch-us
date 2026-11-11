import type { MusicState } from "../hooks/useMusic";
import { resolveSourceIdentity } from "../providers/identityResolver";
import type { MediaCapabilities, UniversalMediaState } from "../providers/types";

export function normalizeMediaSession(music: MusicState | undefined, position: number): UniversalMediaState | null {
	if (!music?.available) return null;

	const source = resolveSourceIdentity(music);

	const capabilities: MediaCapabilities = {
		canPlay: !music.playing,
		canPause: music.playing,
		canSkipNext: music.canNext,
		canSkipPrevious: music.canPrevious,
		canSeek: Boolean(music.durationMs && music.durationMs > 0),
		canChangeVolume: Boolean(music.volume || music.appVolume),
		canOpenSource: Boolean(music.appId || music.appName),
		canOpenVideo: Boolean(music.youtubeId),
		canControlRemoteDevice: Boolean(music.appDevice),
	};

	const status = music.playing ? "playing" : "paused";

	return {
		sessionId: `${music.appId}|${music.title}|${music.artist}`,
		source,
		metadata: {
			title: music.title || "Unknown Track",
			artist: music.artist || undefined,
			album: music.album || undefined,
			artwork: music.thumbnail,
		},
		playback: {
			status,
			position,
			duration: music.durationMs ? music.durationMs : undefined,
			positionAt: music.positionAt,
		},
		capabilities,
		device: music.appDevice
			? {
					name: music.appDevice,
					type: "Remote Speaker / Connect",
					isRemote: true,
				}
			: undefined,
		volume: {
			system: music.volume?.level,
			app: music.appVolume?.level,
			muted: music.volume?.muted ?? music.appVolume?.muted,
		},
		appIcon: music.appIcon,
		youtubeId: music.youtubeId,
		updatedAt: Date.now(),
	};
}
