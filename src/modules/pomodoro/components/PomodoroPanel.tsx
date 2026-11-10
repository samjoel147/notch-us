import {
	FlameIcon,
	PauseIcon,
	PlayIcon,
	RotateCcwIcon,
	SkipForwardIcon,
	SparklesIcon,
	TimerIcon,
} from "lucide-react";
import { cn } from "../../../core/cn";
import { useT } from "../../../core/i18n";
import type { PomodoroPhase, PomodoroTimer } from "../types";

function formatMinutesSeconds(ms: number): string {
	const totalSec = Math.max(0, Math.ceil(ms / 1000));
	const mins = Math.floor(totalSec / 60);
	const secs = String(totalSec % 60).padStart(2, "0");
	return `${mins}:${secs}`;
}

export function PomodoroPanel({
	timer,
	onStart,
	onPause,
	onReset,
	onSkip,
	onSelectPhase,
}: {
	timer: PomodoroTimer;
	onStart: () => void;
	onPause: () => void;
	onReset: () => void;
	onSkip: () => void;
	onSelectPhase: (phase: PomodoroPhase) => void;
}) {
	const t = useT();

	const isWork = timer.phase === "work";
	const isLong = timer.phase === "longBreak";
	const accent = isWork ? "#FF6358" : isLong ? "#5E5CE6" : "#30D158";

	// SVG Progress Ring calculations
	const radius = 38;
	const circumference = 2 * Math.PI * radius;
	const progress = timer.total > 0 ? Math.max(0, Math.min(1, timer.remaining / timer.total)) : 1;
	const strokeDashoffset = circumference * (1 - progress);

	return (
		<div className="flex h-full flex-col justify-between p-1.5" onClick={(e) => e.stopPropagation()}>
			{/* Phase Selection Tabs */}
			<div className="flex items-center justify-between gap-2 border-b border-white/6 pb-2">
				<div className="flex items-center gap-1 rounded-full bg-white/6 p-0.5">
					<PhaseButton
						active={timer.phase === "work"}
						color="#FF6358"
						label={t("pomodoro.phase.work")}
						onClick={() => onSelectPhase("work")}
					/>
					<PhaseButton
						active={timer.phase === "break"}
						color="#30D158"
						label={t("pomodoro.phase.break")}
						onClick={() => onSelectPhase("break")}
					/>
					<PhaseButton
						active={timer.phase === "longBreak"}
						color="#5E5CE6"
						label={t("pomodoro.phase.longBreak")}
						onClick={() => onSelectPhase("longBreak")}
					/>
				</div>

				<div className="flex items-center gap-1.5 px-2 text-[12px] font-semibold text-text-dim">
					<FlameIcon size={14} className="fill-[currentColor] text-[#FF9F0A]" />
					<span>{t("pomodoro.roundsCount", { n: timer.rounds })}</span>
				</div>
			</div>

			{/* Center Body: Progress Ring & Time + Actions */}
			<div className="flex items-center justify-between gap-6 px-3 py-1">
				{/* Progress Ring with Time Center */}
				<div className="relative flex items-center gap-4">
					<div className="relative grid size-24 place-items-center flex-none">
						<svg className="size-24 -rotate-90 transform" viewBox="0 0 96 96">
							<circle
								cx="48"
								cy="48"
								r={radius}
								className="stroke-white/10"
								strokeWidth="5"
								fill="transparent"
							/>
							<circle
								cx="48"
								cy="48"
								r={radius}
								stroke={accent}
								strokeWidth="5"
								strokeDasharray={circumference}
								strokeDashoffset={strokeDashoffset}
								strokeLinecap="round"
								fill="transparent"
								className="transition-[stroke-dashoffset] duration-500 ease-linear"
							/>
						</svg>
						<div className="absolute inset-0 flex flex-col items-center justify-center">
							<span className="text-[20px] font-bold tracking-tight text-text tabular-nums">
								{formatMinutesSeconds(timer.remaining)}
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-0.5">
						<span className="text-[14px] font-bold tracking-tight text-text">
							{timer.done
								? t("pomodoro.phaseCompleted")
								: isWork
									? t("pomodoro.status.focusing")
									: t("pomodoro.status.resting")}
						</span>
						<span className="text-[12px] text-text-dim">
							{timer.done
								? t("pomodoro.readyNext")
								: timer.running
									? t("pomodoro.inProgress")
									: t("pomodoro.paused")}
						</span>
						{timer.rounds > 0 && (
							<div className="mt-1 flex items-center gap-1">
								{Array.from({ length: 4 }).map((_, i) => (
									<span
										key={i}
										className={cn(
											"size-1.5 rounded-full",
											i < timer.rounds % 4 || (timer.rounds > 0 && timer.rounds % 4 === 0)
												? "bg-[#FF9F0A]"
												: "bg-white/15",
										)}
									/>
								))}
								<span className="ml-1 text-[10.5px] text-text-faint">
									{t("pomodoro.cycleProgress", { cur: (timer.rounds % 4) || 4, total: 4 })}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Primary Action Buttons */}
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={timer.running ? onPause : onStart}
						style={{ backgroundColor: timer.running ? "rgba(255,255,255,0.12)" : accent }}
						className={cn(
							"flex h-10 items-center gap-2 rounded-2xl px-5 text-[13px] font-bold text-white shadow-sm transition-[filter,transform] duration-150 hover:brightness-110 active:scale-95",
							timer.running && "text-text",
						)}
					>
						{timer.running ? (
							<>
								<PauseIcon size={15} fill="currentColor" />
								{t("pomodoro.actions.pause")}
							</>
						) : (
							<>
								<PlayIcon size={15} fill="currentColor" />
								{timer.done || timer.remaining < timer.total
									? t("pomodoro.actions.resume")
									: t("pomodoro.actions.start")}
							</>
						)}
					</button>

					<button
						type="button"
						onClick={onSkip}
						title={t("pomodoro.actions.skip")}
						className="grid size-9.5 place-items-center rounded-2xl bg-white/8 text-text-dim transition-colors hover:bg-white/15 hover:text-text active:scale-95"
					>
						<SkipForwardIcon size={15} />
					</button>

					<button
						type="button"
						onClick={onReset}
						title={t("pomodoro.actions.reset")}
						className="grid size-9.5 place-items-center rounded-2xl bg-white/8 text-text-dim transition-colors hover:bg-white/15 hover:text-text active:scale-95"
					>
						<RotateCcwIcon size={15} />
					</button>
				</div>
			</div>
		</div>
	);
}

function PhaseButton({
	active,
	color,
	label,
	onClick,
}: {
	active: boolean;
	color: string;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"rounded-full px-3 py-1 text-[11.5px] font-semibold transition-all duration-150",
				active ? "text-white shadow-xs" : "text-text-dim hover:text-text",
			)}
			style={{ backgroundColor: active ? color : "transparent" }}
		>
			{label}
		</button>
	);
}

