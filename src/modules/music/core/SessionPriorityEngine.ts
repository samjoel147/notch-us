import type { UniversalMediaState } from "../providers/types";

interface SessionRecord {
	state: UniversalMediaState;
	lastActiveTime: number;
	lastInteractedTime: number;
}

const sessions = new Map<string, SessionRecord>();
let activeSessionId: string | null = null;
let lastSwitchTime = 0;
const HYSTERESIS_MS = 600;

export function recordSession(state: UniversalMediaState): void {
	const now = Date.now();
	const existing = sessions.get(state.sessionId);

	sessions.set(state.sessionId, {
		state,
		lastActiveTime: state.playback.status === "playing" ? now : (existing?.lastActiveTime ?? now),
		lastInteractedTime: existing?.lastInteractedTime ?? now,
	});
}

export function recordInteraction(sessionId: string): void {
	const rec = sessions.get(sessionId);
	if (rec) {
		rec.lastInteractedTime = Date.now();
	}
}

export function selectActiveSession(current: UniversalMediaState | null, isPinned = false): UniversalMediaState | null {
	if (!current) return null;

	const now = Date.now();
	recordSession(current);

	if (isPinned) {
		activeSessionId = current.sessionId;
		return current;
	}

	// Playing session always takes priority
	if (current.playback.status === "playing") {
		if (activeSessionId !== current.sessionId) {
			if (now - lastSwitchTime > HYSTERESIS_MS || !activeSessionId) {
				activeSessionId = current.sessionId;
				lastSwitchTime = now;
			}
		}
		return current;
	}

	// If paused and we have an active session within grace period
	if (activeSessionId) {
		const rec = sessions.get(activeSessionId);
		if (rec && now - rec.lastActiveTime < 15_000) {
			return rec.state;
		}
	}

	activeSessionId = current.sessionId;
	return current;
}
