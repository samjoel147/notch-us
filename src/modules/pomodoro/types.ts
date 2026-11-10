export type PomodoroPhase = "work" | "break" | "longBreak";

export interface PomodoroTimer {
	phase: PomodoroPhase;
	running: boolean;
	/** Target epoch ms when running. */
	endsAt: number | null;
	/** Milliseconds left in current phase. */
	remaining: number;
	/** Total duration of current phase in ms. */
	total: number;
	/** Completed work rounds today. */
	rounds: number;
	/** Whether the phase just ended and needs user interaction. */
	done: boolean;
	doneAt: number | null;
}
