import {
	CoffeeIcon,
	FlameIcon,
	LeafIcon,
	PauseIcon,
	PlayIcon,
	RotateCcwIcon,
	SkipForwardIcon,
	SparklesIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "../../../core/cn";
import { useT } from "../../../core/i18n";
import type { PomodoroPhase, PomodoroTimer } from "../types";

function formatMinutesSeconds(ms: number): string {
	const totalSec = Math.max(0, Math.ceil(ms / 1000));
	const mins = Math.floor(totalSec / 60);
	const secs = String(totalSec % 60).padStart(2, "0");
	return `${mins}:${secs}`;
}

const PRESETS = [25, 45, 60];

export function PomodoroPanel({
	timer,
	onStart,
	onPause,
	onReset,
	onSkip,
	onSelectPhase,
	onSetDuration,
}: {
	timer: PomodoroTimer;
	onStart: () => void;
	onPause: () => void;
	onReset: () => void;
	onSkip: () => void;
	onSelectPhase: (phase: PomodoroPhase) => void;
	onSetDuration?: (minutes: number) => void;
}) {
	const t = useT();
	const gradientId = useId();

	const isWork = timer.phase === "work";
	const isLong = timer.phase === "longBreak";
	const accent = isWork ? "#FF6358" : isLong ? "#5E5CE6" : "#30D158";

	// SVG Progress Ring calculations
	const radius = 37;
	const circumference = 2 * Math.PI * radius;
	const progress = timer.total > 0 ? Math.max(0, Math.min(1, timer.remaining / timer.total)) : 1;
	const strokeDashoffset = circumference * (1 - progress);

	return (
		<div
			className="group relative flex h-full flex-col justify-between p-2 select-none"
			onClick={(e) => e.stopPropagation()}
		>
			{/* Atmospheric Phase Glow - sinks organically into the notch body without box boundaries */}
			<div
				className="pointer-events-none absolute -inset-6 transition-opacity duration-700 ease-out"
				style={{
					background: `radial-gradient(circle at 18% 40%, ${accent}${timer.running ? "24" : "10"} 0%, ${accent}${timer.running ? "0c" : "04"} 42%, transparent 70%)`,
				}}
			/>

			{/* Phase Selection Tabs & Daily Rounds */}
			<div className="relative z-10 flex items-center justify-between gap-2 pb-1.5">
				{/* VisionOS Segmented Glass Phase Switcher */}
				<div className="flex items-center gap-1 rounded-full bg-white/[0.05] dark:bg-white/[0.04] backdrop-blur-md border border-white/[0.08] p-1 shadow-inner">
					<PhaseButton
						active={timer.phase === "work"}
						color="#FF6358"
						icon={<SparklesIcon size={12} />}
						label={t("pomodoro.phase.work")}
						onClick={() => onSelectPhase("work")}
					/>
					<PhaseButton
						active={timer.phase === "break"}
						color="#30D158"
						icon={<LeafIcon size={12} />}
						label={t("pomodoro.phase.break")}
						onClick={() => onSelectPhase("break")}
					/>
					<PhaseButton
						active={timer.phase === "longBreak"}
						color="#5E5CE6"
						icon={<CoffeeIcon size={12} />}
						label={t("pomodoro.phase.longBreak")}
						onClick={() => onSelectPhase("longBreak")}
					/>
				</div>

				{/* Rounds Flame Counter */}
				<div className="flex items-center gap-1.5 rounded-full bg-[#FF9F0A]/12 border border-[#FF9F0A]/25 px-2.5 py-1 text-[11px] font-bold text-[#FF9F0A] shadow-xs">
					<FlameIcon size={13} className="fill-[currentColor]" />
					<span>{t("pomodoro.roundsCount", { n: timer.rounds })}</span>
				</div>
			</div>

			{/* Center Body: Luminous Ring + Cycle Status + Controls */}
			<div className="relative z-10 flex items-center justify-between gap-6 px-3 py-1">
				{/* Luminous Progress Ring with Centered Time */}
				<div className="relative flex items-center gap-4.5">
					<div className="relative grid size-24 place-items-center flex-none">
						<svg className="size-24 -rotate-90 transform overflow-visible" viewBox="0 0 96 96" aria-hidden="true">
							<defs>
								<linearGradient id={`grad-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" stopColor={accent} stopOpacity="0.85" />
									<stop offset="100%" stopColor={accent} stopOpacity="1" />
								</linearGradient>
								<filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
									<feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={accent} floodOpacity="0.45" />
								</filter>
							</defs>
							{/* Track Ring */}
							<circle
								cx="48"
								cy="48"
								r={radius}
								className="stroke-black/10 dark:stroke-white/10"
								strokeWidth="5"
								fill="transparent"
							/>
							{/* Active Progress Ring */}
							<circle
								cx="48"
								cy="48"
								r={radius}
								stroke={`url(#grad-${gradientId})`}
								strokeWidth="5.5"
								strokeDasharray={circumference}
								strokeDashoffset={strokeDashoffset}
								strokeLinecap="round"
								fill="transparent"
								filter={`url(#glow-${gradientId})`}
								className="transition-[stroke-dashoffset] duration-500 ease-linear"
							/>
						</svg>
						<div className="absolute inset-0 flex flex-col items-center justify-center">
							<span className="text-[20px] font-bold tracking-tight text-text tabular-nums">
								{formatMinutesSeconds(timer.remaining)}
							</span>
						</div>
					</div>

					{/* Metadata, 4-step Cycle Beads & Quick Preset Chips */}
					<div className="flex flex-col gap-0.5">
						<span className="text-[14px] font-bold tracking-tight text-text">
							{timer.done
								? t("pomodoro.phaseCompleted")
								: isWork
									? t("pomodoro.status.focusing")
									: t("pomodoro.status.resting")}
						</span>
						<span className="text-[11.5px] font-medium text-text-dim">
							{timer.done ? t("pomodoro.readyNext") : timer.running ? t("pomodoro.inProgress") : t("pomodoro.paused")}
						</span>

						{/* 4-step Cycle Progress Beads */}
						<div className="mt-1 flex items-center gap-1.5">
							{Array.from({ length: 4 }).map((_, i) => (
								<span
									// biome-ignore lint/suspicious/noArrayIndexKey: fixed 4-step round progress dots
									key={i}
									className={cn(
										"size-2 rounded-full transition-all duration-300",
										i < timer.rounds % 4 || (timer.rounds > 0 && timer.rounds % 4 === 0)
											? "bg-[#FF9F0A] shadow-[0_0_6px_rgba(255,159,10,0.6)]"
											: "bg-white/15 dark:bg-white/10",
									)}
								/>
							))}
							<span className="ml-1 text-[10.5px] font-medium text-text-dim tabular-nums">
								{t("pomodoro.cycleProgress", { cur: timer.rounds % 4 || (timer.rounds > 0 ? 4 : 1), total: 4 })}
							</span>
						</div>

						{/* Quick Duration Preset Chips (Active when paused or during work) */}
						{isWork && onSetDuration && (
							<div className="mt-1 flex items-center gap-1.5">
								{PRESETS.map((p) => (
									<button
										key={p}
										type="button"
										onClick={() => onSetDuration(p)}
										className={cn(
											"rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer",
											timer.total === p * 60_000
												? "bg-white/20 text-text shadow-xs"
												: "bg-white/[0.06] text-text-dim hover:bg-white/10 hover:text-text",
										)}
									>
										{p}m
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Primary VisionOS Glass Action Buttons */}
				<div className="flex items-center gap-2">
					<motion.button
						type="button"
						whileTap={{ scale: 0.94 }}
						onClick={timer.running ? onPause : onStart}
						style={{
							backgroundColor: timer.running ? "rgba(255,255,255,0.12)" : accent,
							boxShadow: timer.running ? "none" : `0 4px 16px ${accent}45`,
						}}
						className={cn(
							"flex h-10 items-center gap-2 rounded-2xl px-5 text-[13px] font-bold text-white backdrop-blur-md transition-all duration-200 hover:brightness-110 cursor-pointer",
							timer.running && "text-text border border-white/10",
						)}
					>
						{timer.running ? (
							<>
								<PauseIcon size={14} fill="currentColor" />
								<span>{t("pomodoro.actions.pause")}</span>
							</>
						) : (
							<>
								<PlayIcon size={14} fill="currentColor" />
								<span>
									{timer.done || timer.remaining < timer.total
										? t("pomodoro.actions.resume")
										: t("pomodoro.actions.start")}
								</span>
							</>
						)}
					</motion.button>

					<button
						type="button"
						onClick={onSkip}
						title={t("pomodoro.actions.skip")}
						className="grid size-10 place-items-center rounded-2xl bg-white/[0.06] dark:bg-white/[0.05] border border-hairline/80 text-text-dim backdrop-blur-md transition-all hover:bg-white/[0.12] hover:text-text active:scale-95 cursor-pointer"
					>
						<SkipForwardIcon size={14} />
					</button>

					<button
						type="button"
						onClick={onReset}
						title={t("pomodoro.actions.reset")}
						className="grid size-10 place-items-center rounded-2xl bg-white/[0.06] dark:bg-white/[0.05] border border-hairline/80 text-text-dim backdrop-blur-md transition-all hover:bg-white/[0.12] hover:text-text active:scale-95 cursor-pointer"
					>
						<RotateCcwIcon size={14} />
					</button>
				</div>
			</div>
		</div>
	);
}

function PhaseButton({
	active,
	color,
	icon,
	label,
	onClick,
}: {
	active: boolean;
	color: string;
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-all duration-200 cursor-pointer",
				active ? "text-white shadow-xs" : "text-text-dim hover:text-text",
			)}
			style={{ backgroundColor: active ? color : "transparent" }}
		>
			<span className="opacity-90">{icon}</span>
			<span>{label}</span>
		</button>
	);
}
