import { useCallback, useEffect, useRef, useState } from "react";
import type { PomodoroPhase, PomodoroTimer } from "./types";

const MINUTE = 60_000;
const STORAGE_KEY = "island-pomodoro-rounds";

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
		const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
		(phase: PomodoroPhase): number => {
			if (phase === "work") return workMinutes * MINUTE;
			if (phase === "longBreak") return longBreakMinutes * MINUTE;
			return breakMinutes * MINUTE;
		},
		[workMinutes, breakMinutes, longBreakMinutes],
	);

	const [phase, setPhase] = useState<PomodoroPhase>("work");
	const [running, setRunning] = useState<boolean>(false);
	const [endsAt, setEndsAt] = useState<number | null>(null);
	const [remaining, setRemaining] = useState<number>(() => getDuration("work"));
	const [total, setTotal] = useState<number>(() => getDuration("work"));
	const [rounds, setRounds] = useState<number>(loadSavedRounds);
	const [done, setDone] = useState<boolean>(false);
	const [doneAt, setDoneAt] = useState<number | null>(null);

	const timerRef = useRef<number | undefined>(undefined);

	// Sync duration changes if timer has not been started yet
	useEffect(() => {
		if (!running && endsAt === null) {
			const dur = getDuration(phase);
			setTotal(dur);
			setRemaining(dur);
		}
	}, [getDuration, phase, running, endsAt]);

	// Timer countdown loop
	useEffect(() => {
		if (!running || !endsAt || !enabled) {
			window.clearInterval(timerRef.current);
			return;
		}

		const checkTick = () => {
			const left = Math.max(0, endsAt - Date.now());
			setRemaining(left);

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
				setTotal(nextDuration);
				setRemaining(nextDuration);
				setDone(true);
				setDoneAt(Date.now());

				if (willAutoRun) {
					setEndsAt(Date.now() + nextDuration);
					setRunning(true);
				} else {
					setEndsAt(null);
					setRunning(false);
				}
			}
		};

		checkTick();
		timerRef.current = window.setInterval(checkTick, 500);

		return () => window.clearInterval(timerRef.current);
	}, [running, endsAt, enabled, soundChime, phase, rounds, roundsBeforeLong, autoBreak, autoWork, getDuration]);

	const start = useCallback(() => {
		setDone(false);
		setEndsAt(Date.now() + remaining);
		setRunning(true);
	}, [remaining]);

	const pause = useCallback(() => {
		if (endsAt) {
			setRemaining(Math.max(0, endsAt - Date.now()));
		}
		setEndsAt(null);
		setRunning(false);
	}, [endsAt]);

	const toggle = useCallback(() => {
		if (running) {
			pause();
		} else {
			start();
		}
	}, [running, pause, start]);

	const reset = useCallback(() => {
		setRunning(false);
		setEndsAt(null);
		setDone(false);
		const dur = getDuration(phase);
		setTotal(dur);
		setRemaining(dur);
	}, [getDuration, phase]);

	const skip = useCallback(() => {
		const isWork = phase === "work";
		const nextPhase: PomodoroPhase = isWork
			? (rounds + 1) % roundsBeforeLong === 0
				? "longBreak"
				: "break"
			: "work";

		const dur = getDuration(nextPhase);
		setPhase(nextPhase);
		setTotal(dur);
		setRemaining(dur);
		setEndsAt(null);
		setRunning(false);
		setDone(false);
	}, [phase, rounds, roundsBeforeLong, getDuration]);

	const selectPhase = useCallback(
		(newPhase: PomodoroPhase) => {
			setPhase(newPhase);
			const dur = getDuration(newPhase);
			setTotal(dur);
			setRemaining(dur);
			setEndsAt(null);
			setRunning(false);
			setDone(false);
		},
		[getDuration],
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
	};
}

