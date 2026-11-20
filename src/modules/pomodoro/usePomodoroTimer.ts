import { useCallback, useEffect, useRef, useState } from "react";
import type { PomodoroPhase, PomodoroTimer } from "./types";

const MINUTE = 60_000;
const STORAGE_KEY = "island-pomodoro-rounds";

interface PhaseState {
	remaining: number;
	total: number;
	endsAt: number | null;
	running: boolean;
	done: boolean;
	doneAt: number | null;
}

function todayKey(): string {
	return new Date().toDateString();
}

function loadSavedRounds(): number {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return 0;
		const parsed = JSON.parse(raw) as { date: string; rounds: number };
		return parsed.date === todayKey() ? parsed.rounds : 0;
	} catch {
		return 0;
	}
}

function saveRounds(rounds: number) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), rounds }));
	} catch {
		// Ignore storage errors in private browsing/sandboxes
	}
}

function playChime() {
	try {
		const AudioCtx = window.AudioContext || window.webkitAudioContext;
		if (!AudioCtx) return;
		const ctx = new AudioCtx();
		const now = ctx.currentTime;

		const osc1 = ctx.createOscillator();
		const osc2 = ctx.createOscillator();
		const gain = ctx.createGain();

		osc1.type = "sine";
		osc1.frequency.setValueAtTime(587.33, now);
		osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

		osc2.type = "sine";
		osc2.frequency.setValueAtTime(880, now);

		gain.gain.setValueAtTime(0.18, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

		osc1.connect(gain);
		osc2.connect(gain);
		gain.connect(ctx.destination);

		osc1.start(now);
		osc2.start(now);
		osc1.stop(now + 1.2);
		osc2.stop(now + 1.2);
	} catch {
		// Guard against browser autoplay policy restrictions
	}
}

export function usePomodoroTimer(
	workMinutes: number,
	breakMinutes: number,
	longBreakMinutes: number,
	roundsBeforeLong: number,
	autoBreak: boolean,
	autoWork: boolean,
	soundChime: boolean,
	enabled: boolean,
) {
	const getDuration = useCallback(
		(targetPhase: PomodoroPhase): number => {
			if (targetPhase === "work") return workMinutes * MINUTE;
			if (targetPhase === "longBreak") return longBreakMinutes * MINUTE;
			return breakMinutes * MINUTE;
		},
		[workMinutes, breakMinutes, longBreakMinutes],
	);

	const [phase, setPhase] = useState<PomodoroPhase>("work");
	const [rounds, setRounds] = useState<number>(loadSavedRounds);

	// Multi-phase state store: preserves exact remaining & total times independently across phase switches
	const [phaseStates, setPhaseStates] = useState<Record<PomodoroPhase, PhaseState>>(() => ({
		work: {
			remaining: workMinutes * MINUTE,
			total: workMinutes * MINUTE,
			endsAt: null,
			running: false,
			done: false,
			doneAt: null,
		},
		break: {
			remaining: breakMinutes * MINUTE,
			total: breakMinutes * MINUTE,
			endsAt: null,
			running: false,
			done: false,
			doneAt: null,
		},
		longBreak: {
			remaining: longBreakMinutes * MINUTE,
			total: longBreakMinutes * MINUTE,
			endsAt: null,
			running: false,
			done: false,
			doneAt: null,
		},
	}));

	const activeState = phaseStates[phase];
	const { remaining, total, endsAt, running, done, doneAt } = activeState;

	const timerRef = useRef<number | undefined>(undefined);

	// Sync duration changes if a phase is unstarted and untouched
	useEffect(() => {
		setPhaseStates((prev) => {
			let changed = false;
			const next = { ...prev };
			const durations: Record<PomodoroPhase, number> = {
				work: workMinutes * MINUTE,
				break: breakMinutes * MINUTE,
				longBreak: longBreakMinutes * MINUTE,
			};

			for (const p of ["work", "break", "longBreak"] as const) {
				const current = prev[p];
				const defaultDur = durations[p];
				if (
					!current.running &&
					current.endsAt === null &&
					current.remaining === current.total &&
					current.total !== defaultDur
				) {
					next[p] = {
						...current,
						total: defaultDur,
						remaining: defaultDur,
					};
					changed = true;
				}
			}

			return changed ? next : prev;
		});
	}, [workMinutes, breakMinutes, longBreakMinutes]);

	// Timer countdown loop for active phase
	useEffect(() => {
		if (!running || !endsAt || !enabled) {
			window.clearInterval(timerRef.current);
			return;
		}

		const checkTick = () => {
			const left = Math.max(0, endsAt - Date.now());

			if (left <= 0) {
				window.clearInterval(timerRef.current);
				if (soundChime) playChime();

				const isWork = phase === "work";
				const nextRounds = isWork ? rounds + 1 : rounds;
				if (isWork) {
					setRounds(nextRounds);
					saveRounds(nextRounds);
				}

				const nextPhase: PomodoroPhase = isWork
					? nextRounds % roundsBeforeLong === 0
						? "longBreak"
						: "break"
					: "work";

				const nextDuration = getDuration(nextPhase);
				const willAutoRun = isWork ? autoBreak : autoWork;

				setPhase(nextPhase);
				setPhaseStates((prev) => {
					const curDur = getDuration(phase);
					return {
						...prev,
						[phase]: {
							...prev[phase],
							remaining: curDur,
							total: curDur,
							endsAt: null,
							running: false,
							done: false,
						},
						[nextPhase]: {
							...prev[nextPhase],
							remaining: nextDuration,
							total: nextDuration,
							endsAt: willAutoRun ? Date.now() + nextDuration : null,
							running: willAutoRun,
							done: !willAutoRun,
							doneAt: Date.now(),
						},
					};
				});
			} else {
				setPhaseStates((prev) => ({
					...prev,
					[phase]: {
						...prev[phase],
						remaining: left,
					},
				}));
			}
		};

		checkTick();
		timerRef.current = window.setInterval(checkTick, 500);

		return () => window.clearInterval(timerRef.current);
	}, [running, endsAt, enabled, soundChime, phase, rounds, roundsBeforeLong, autoBreak, autoWork, getDuration]);

	const start = useCallback(() => {
		setPhaseStates((prev) => {
			const current = prev[phase];
			const rem = current.remaining <= 0 ? current.total : current.remaining;
			return {
				...prev,
				[phase]: {
					...current,
					remaining: rem,
					endsAt: Date.now() + rem,
					running: true,
					done: false,
				},
			};
		});
	}, [phase]);

	const pause = useCallback(() => {
		setPhaseStates((prev) => {
			const current = prev[phase];
			const rem = current.endsAt ? Math.max(0, current.endsAt - Date.now()) : current.remaining;
			return {
				...prev,
				[phase]: {
					...current,
					remaining: rem,
					endsAt: null,
					running: false,
				},
			};
		});
	}, [phase]);

	const toggle = useCallback(() => {
		if (running) {
			pause();
		} else {
			start();
		}
	}, [running, pause, start]);

	const reset = useCallback(() => {
		const dur = getDuration(phase);
		setPhaseStates((prev) => ({
			...prev,
			[phase]: {
				remaining: dur,
				total: dur,
				endsAt: null,
				running: false,
				done: false,
				doneAt: null,
			},
		}));
	}, [getDuration, phase]);

	const skip = useCallback(() => {
		const isWork = phase === "work";
		const nextPhase: PomodoroPhase = isWork ? ((rounds + 1) % roundsBeforeLong === 0 ? "longBreak" : "break") : "work";
		const dur = getDuration(nextPhase);

		setPhase(nextPhase);
		setPhaseStates((prev) => {
			const currentDur = getDuration(phase);
			return {
				...prev,
				[phase]: {
					...prev[phase],
					remaining: currentDur,
					total: currentDur,
					endsAt: null,
					running: false,
					done: false,
				},
				[nextPhase]: {
					...prev[nextPhase],
					remaining: prev[nextPhase].remaining > 0 ? prev[nextPhase].remaining : dur,
					total: prev[nextPhase].total > 0 ? prev[nextPhase].total : dur,
					endsAt: null,
					running: false,
					done: false,
				},
			};
		});
	}, [phase, rounds, roundsBeforeLong, getDuration]);

	const selectPhase = useCallback(
		(newPhase: PomodoroPhase) => {
			if (newPhase === phase) return;

			setPhaseStates((prev) => {
				const current = prev[phase];
				if (!current.running) return prev;
				const rem = current.endsAt ? Math.max(0, current.endsAt - Date.now()) : current.remaining;
				return {
					...prev,
					[phase]: {
						...current,
						remaining: rem,
						endsAt: null,
						running: false,
					},
				};
			});

			setPhase(newPhase);
		},
		[phase],
	);

	const setCustomDuration = useCallback(
		(minutes: number) => {
			const dur = Math.max(1, minutes) * MINUTE;
			setPhaseStates((prev) => {
				const current = prev[phase];
				return {
					...prev,
					[phase]: {
						...current,
						total: dur,
						remaining: dur,
						endsAt: current.running ? Date.now() + dur : null,
						done: false,
					},
				};
			});
		},
		[phase],
	);

	const timer: PomodoroTimer = {
		phase,
		running,
		endsAt,
		remaining,
		total,
		rounds,
		done,
		doneAt,
	};

	return {
		timer,
		start,
		pause,
		toggle,
		reset,
		skip,
		selectPhase,
		setCustomDuration,
	};
}
