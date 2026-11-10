import { emitLocal } from "../../core/bridge";
import { showVolume } from "./activities";
import { art, defineMock, provider, svgArt } from "./kit";

const tracks = [
	{
		title: "Midnight City (Extended Version)",
		artist: "M83",
		album: "Hurry Up, We're Dreaming",
		durationMs: 283_000,
		thumbnail: art,
	},
	{
		title: "Blinding Lights",
		artist: "The Weeknd",
		album: "After Hours",
		durationMs: 200_000,
		thumbnail: svgArt(
			"<defs><linearGradient id='g' x1='0' y1='1' x2='1' y2='0'><stop offset='0' stop-color='#e8173c'/><stop offset='1' stop-color='#ffb02e'/></linearGradient></defs><rect width='120' height='120' fill='url(#g)'/><rect x='34' y='34' width='52' height='52' rx='10' fill='rgba(0,0,0,.3)'/>",
		),
	},
	{
		title: "Starboy",
		artist: "The Weeknd ft. Daft Punk",
		album: "Starboy",
		durationMs: 230_000,
		thumbnail: svgArt(
			"<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#1ed760'/><stop offset='1' stop-color='#0055ff'/></linearGradient></defs><rect width='120' height='120' fill='url(#g)'/><circle cx='60' cy='60' r='26' fill='rgba(0,0,0,.4)'/>",
		),
	},
];

const SERVICES: Record<string, { appId: string; appName: string; appDevice: string | null; youtubeId: string | null }> =
	{
		Spotify: {
			appId: "Spotify.exe",
			appName: "Spotify",
			appDevice: "Connect · Living Room",
			youtubeId: null,
		},
		"YouTube Music": {
			appId: "msedge_music.youtube.com",
			appName: "YouTube Music",
			appDevice: null,
			youtubeId: null,
		},
		YouTube: {
			appId: "chrome.exe",
			appName: "YouTube",
			appDevice: null,
			youtubeId: "dQw4w9WgXcQ",
		},
		"Apple Music": {
			appId: "AppleMusic.exe",
			appName: "Apple Music",
			appDevice: null,
			youtubeId: null,
		},
		TIDAL: {
			appId: "TIDAL.exe",
			appName: "TIDAL",
			appDevice: null,
			youtubeId: null,
		},
		"Local Media": {
			appId: "vlc.exe",
			appName: "VLC media player",
			appDevice: null,
			youtubeId: null,
		},
	};

let currentService = "Spotify";

const state = provider("music", {
	available: true,
	playing: true,
	...tracks[0],
	...SERVICES.Spotify,
	positionMs: 30_000,
	positionAt: Date.now(),
	canNext: true,
	canPrevious: true,
	volume: { level: 0.42, muted: false },
	appVolume: { level: 0.8, muted: false },
	appIcon: null as string | null,
});

let track = 0;

const position = () => {
	const s = state.get();
	return s.playing ? s.positionMs + Date.now() - s.positionAt : s.positionMs;
};

/** Switches to track `index` (wrapping), `atMs` into it. */
export function playTrack(index: number, atMs = 0) {
	track = (index + tracks.length) % tracks.length;
	state.set((s) => ({ ...s, ...tracks[track], positionMs: atMs, positionAt: Date.now() }));
}

function setPlaying(playing: boolean) {
	state.set((s) => ({ ...s, playing, positionMs: position(), positionAt: Date.now() }));
}

function setSystemVolume(level: number) {
	state.set((s) => ({ ...s, volume: { ...s.volume, level } }));
	showVolume(level);
}

function setService(name: string) {
	currentService = name;
	const s = SERVICES[name];
	if (s) {
		state.set((prev) => ({
			...prev,
			...s,
		}));
	}
}

export const music = defineMock({
	label: "Music",
	start() {
		state.publish();
		// The next song once this one ends, and the waveform while playing.
		setInterval(() => {
			if (state.get().playing && position() >= state.get().durationMs) playTrack(track + 1);
		}, 1000);
		setInterval(() => {
			if (state.get().playing) emitLocal("music://level", 0.25 + Math.random() * 0.6);
		}, 33);
	},
	controls: [
		{
			kind: "toggle",
			label: "Player open",
			value: () => state.get().available,
			set: (available) => state.set((s) => ({ ...s, available })),
		},
		{ kind: "toggle", label: "Playing", value: () => state.get().playing, set: setPlaying },
		{
			kind: "select",
			label: "Streaming service",
			options: Object.keys(SERVICES),
			value: () => currentService,
			set: setService,
		},
		{
			kind: "select",
			label: "Track",
			options: tracks.map((t) => t.title),
			value: () => state.get().title,
			set: (title) => playTrack(tracks.findIndex((t) => t.title === title)),
		},
		{ kind: "button", label: "Next track", run: () => playTrack(track + 1) },
		{
			kind: "range",
			label: "System volume",
			min: 0,
			max: 1,
			step: 0.01,
			value: () => state.get().volume.level,
			set: setSystemVolume,
		},
	],
	actions: {
		music: {
			toggle: () => setPlaying(!state.get().playing),
			next: () => playTrack(track + 1),
			previous: () => playTrack(track - 1),
			seek: (ms) => state.set((s) => ({ ...s, positionMs: Number(ms), positionAt: Date.now() })),
			volume: (change) => {
				const { target, level, muted } = change as {
					target: "system" | "app";
					level?: number;
					muted?: boolean;
				};
				const key = target === "system" ? "volume" : "appVolume";
				state.set((s) => ({
					...s,
					[key]: { level: level ?? s[key].level, muted: muted ?? s[key].muted },
				}));
			},
		},
	},
});
