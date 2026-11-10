import { providerAction, useProvider } from "../../../core/bridge";
import { type MessageKey, type Translate, useT } from "../../../core/i18n";
import type { AgentSnapshot, AgentStatus, UsageLimit } from "../common/types";

/** Mirrors the state published by `src-tauri/src/providers/antigravity.rs`. */
export interface AntigravityState {
	available: boolean;
	/** The exe in use (the setting, else `defaultExe`). */
	exe: string;
	defaultExe: string;
	connected: boolean;
	error: "not-running" | "service-unavailable" | null;
	limits: (UsageLimit & { window: string })[];
	sessions?: {
		id: string;
		project: string;
		cwd: string;
		status: Exclude<AgentStatus, "limitsReset">;
		activity: { kind: string; arg?: string } | null;
		turnStartedAt: number | null;
		finishedAt: number | null;
		lastEventAt: number;
		model: string | null;
		contextPct: number | null;
		summary: string | null;
		prompt: string | null;
	}[];
	tokensToday?: { input: number; output: number; cacheRead: number; cacheWrite: number; messages: number };
}

export const PROVIDER = "antigravity";

const launch = () => providerAction(PROVIDER, "launch");

/** Live Antigravity sessions, tokens today, and plan quota. */
export function useAntigravity(): AgentSnapshot {
	const state = useProvider<AntigravityState>(PROVIDER);
	const t = useT();

	if (!state?.available) return { available: false, sessions: [], limits: [] };

	const window = (w: string) =>
		w === "5h"
			? t("antigravity.window.fiveHour")
			: w === "weekly"
				? t("antigravity.window.weekly")
				: t("antigravity.window.quota");

	return {
		available: true,
		sessions: (state.sessions ?? []).map((s) => ({
			id: s.id,
			title: s.project,
			status: s.status,
			activity: s.activity && describe(t, s.activity),
			turnStartedAt: s.turnStartedAt,
			finishedAt: s.finishedAt,
			lastEventAt: s.lastEventAt,
			model: s.model,
			contextPct: s.contextPct,
			summary: s.summary,
			prompt: s.prompt,
			cwd: s.cwd,
		})),
		tokensToday: state.tokensToday,
		limits: state.limits.map((l) => ({ ...l, label: `${l.label} · ${window(l.window)}` })),
		limitsHint: state.error === "service-unavailable" ? t("antigravity.serviceUnavailable") : undefined,
		metricsHint: state.tokensToday ? undefined : t("antigravity.metricsUnavailable"),
		setup:
			state.error === "not-running"
				? { message: t("antigravity.notRunning"), actionLabel: t("antigravity.launch"), action: launch }
				: undefined,
	};
}

function describe(t: Translate, a: { kind: string; arg?: string }) {
	const key = `activity.${a.kind}` as MessageKey;
	const text = t(key, { arg: a.arg ?? "" });
	return text === key ? (a.arg ?? a.kind) : text;
}
