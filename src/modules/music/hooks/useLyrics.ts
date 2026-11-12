import { useEffect, useState } from "react";
import type { MusicState } from "./useMusic";

export interface LyricLine {
	timeMs: number;
	text: string;
}

export interface LyricsState {
	track: string;
	artist: string;
	lines: LyricLine[];
	plainLyrics?: string;
	loading: boolean;
	error: boolean;
}

/** Parses standard LRC format strings ([mm:ss.xx] Lyric text) */
export function parseLrc(lrcText: string): LyricLine[] {
	if (!lrcText) return [];
	const lines = lrcText.split("\n");
	const result: LyricLine[] = [];
	const timeReg = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\]/g;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) continue;

		const match = timeReg.exec(line);
		if (match) {
			const minutes = Number.parseInt(match[1] || "0", 10);
			const seconds = Number.parseInt(match[2] || "0", 10);
			const millisStr = (match[3] || "0").padEnd(3, "0").slice(0, 3);
			const millis = Number.parseInt(millisStr, 10);
			const timeMs = minutes * 60_000 + seconds * 1000 + millis;

			const text = line.replace(/\[\d{2}:\d{2}\.?\d{0,3}\]/g, "").trim();
			if (text) {
				result.push({ timeMs, text });
			}
		}
		timeReg.lastIndex = 0;
	}

	return result.sort((a, b) => a.timeMs - b.timeMs);
}

/**
 * Automatically queries LRCLIB for synchronized lyrics of the active track
 * and returns the current synchronized lyric line matching live playback time.
 */
export function useLyrics(music: MusicState | undefined, livePositionMs: number) {
	const [state, setState] = useState<LyricsState>({
		track: "",
		artist: "",
		lines: [],
		loading: false,
		error: false,
	});

	const trackTitle = music?.title?.trim() || "";
	const trackArtist = music?.artist?.trim() || "";
	const durationSeconds = music?.durationMs ? Math.round(music.durationMs / 1000) : 0;

	useEffect(() => {
		if (!trackTitle || !trackArtist) {
			setState({ track: "", artist: "", lines: [], loading: false, error: false });
			return;
		}

		let cancelled = false;
		setState((prev) => ({ ...prev, loading: true, error: false }));

		const fetchLyrics = async () => {
			try {
				const params = new URLSearchParams({
					track_name: trackTitle,
					artist_name: trackArtist,
				});
				if (durationSeconds > 0) {
					params.set("duration", durationSeconds.toString());
				}

				const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
				if (!res.ok) {
					if (!cancelled) setState({ track: trackTitle, artist: trackArtist, lines: [], loading: false, error: true });
					return;
				}

				const data = await res.json();
				if (cancelled) return;

				const parsedLines = data.syncedLyrics ? parseLrc(data.syncedLyrics) : [];
				setState({
					track: trackTitle,
					artist: trackArtist,
					lines: parsedLines,
					plainLyrics: data.plainLyrics || undefined,
					loading: false,
					error: false,
				});
			} catch {
				if (!cancelled) {
					setState({ track: trackTitle, artist: trackArtist, lines: [], loading: false, error: true });
				}
			}
		};

		fetchLyrics();

		return () => {
			cancelled = true;
		};
	}, [trackTitle, trackArtist, durationSeconds]);

	// Find the current active line corresponding to playback position
	let currentLine: string | null = null;
	for (let i = state.lines.length - 1; i >= 0; i--) {
		const line = state.lines[i];
		if (line && line.timeMs <= livePositionMs) {
			currentLine = line.text;
			break;
		}
	}

	return {
		hasLyrics: state.lines.length > 0,
		currentLine,
		lines: state.lines,
		loading: state.loading,
	};
}
