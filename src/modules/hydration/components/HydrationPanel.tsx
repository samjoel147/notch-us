import { CheckIcon, DropletIcon, PauseIcon, PlayIcon, PlusIcon, RotateCcwIcon, SparklesIcon } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { cn } from "../../../core/cn";
import { useT } from "../../../core/i18n";
import { useNow } from "../../ai-agents/common/format";

const STORAGE_KEY = "hydration.dailyIntake";

function getTodayStr() {
	return new Date().toISOString().slice(0, 10);
}

function useDailyWaterIntake() {
	const [intake, setIntake] = useState<number>(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (parsed && parsed.date === getTodayStr() && typeof parsed.count === "number") {
					return parsed.count;
				}
			}
		} catch (e) {
			console.warn("Failed to read hydration daily intake:", e);
		}
		return 0;
	});

	const addGlass = useCallback((delta = 1) => {
		setIntake((prev) => {
			const next = Math.max(0, prev + delta);
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayStr(), count: next }));
			} catch (e) {
				console.warn("Failed to save hydration daily intake:", e);
			}
			return next;
		});
	}, []);

	return { intake, addGlass };
}

function remainingLabel(deadline: number, now: number) {
	const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const rest = String(seconds % 60).padStart(2, "0");
	return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

export function HydrationPanel({
	deadline,
	pausedRemaining,
	due,
	goal = 8,
	onConfirm,
	onSnooze,
	onStart,
	onResume,
	onPause,
}: {
	deadline: number | null;
	pausedRemaining: number | null;
	due: boolean;
	goal?: number;
	onConfirm: () => void;
	onSnooze: () => void;
	onStart: () => void;
	onResume: () => void;
	onPause: () => void;
}) {
	const t = useT();
	const now = useNow(1000, !!deadline && !due);
	const running = !!deadline && !due;
	const paused = pausedRemaining !== null;
	const pausedLabel = pausedRemaining === null ? null : remainingLabel(Date.now() + pausedRemaining, Date.now());

	const { intake, addGlass } = useDailyWaterIntake();
	const progressPct = Math.min(100, Math.max(0, Math.round((intake / Math.max(1, goal)) * 100)));

	const handleConfirm = () => {
		addGlass(1);
		onConfirm();
	};

	return (
		<div
			className="group relative flex h-full items-center justify-between gap-4 px-4 py-2 select-none"
			data-due={due || undefined}
			onClick={(e) => e.stopPropagation()}
		>
			{/* Left Column: Fluid Liquid Vessel */}
			<div className="relative flex flex-none items-center">
				<motion.div
					whileHover={{ scale: 1.04 }}
					transition={{ duration: 0.2 }}
					className={cn(
						"relative flex h-[78px] w-[52px] flex-col justify-end overflow-hidden rounded-[20px] p-1 transition-all duration-300",
						"bg-card/70 dark:bg-white/[0.04] backdrop-blur-xl",
						"border border-hairline/80 dark:border-white/[0.12]",
						"shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.18)]",
						due && "shadow-[0_0_24px_rgba(56,189,248,0.45)] border-cyan-400/50",
					)}
				>
					{/* Ambient Glow */}
					<div
						className={cn(
							"pointer-events-none absolute inset-0 opacity-20 blur-md transition-opacity duration-300",
							due ? "bg-cyan-400 opacity-40 animate-pulse" : "bg-sky-400",
						)}
					/>

					{/* Liquid Wave Fill */}
					<div
						className="relative z-0 w-full rounded-b-[16px] bg-gradient-to-t from-sky-600 via-cyan-500 to-sky-400 transition-all duration-500 ease-out"
						style={{ height: `${Math.max(14, progressPct)}%` }}
					>
						{/* Top Meniscus Highlight */}
						<div className="absolute -top-1 left-0 right-0 h-2 rounded-full bg-white/40 blur-[1px]" />
					</div>

					{/* Droplet & Percentage Badge */}
					<div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
						<DropletIcon
							size={18}
							className={cn(
								"drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] transition-colors duration-300",
								progressPct > 45 ? "text-white" : "text-cyan-400",
								due && "animate-bounce text-white",
							)}
						/>
						<span
							className={cn(
								"mt-0.5 text-[9.5px] font-extrabold tracking-tight tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]",
								progressPct > 45 ? "text-white" : "text-text",
							)}
						>
							{progressPct}%
						</span>
					</div>
				</motion.div>
			</div>

			{/* Center Column: Telemetry & Goal Tracker */}
			<div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
				{/* Status Header Pill */}
				<div className="flex items-center gap-2">
					<div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5">
						<span
							className={cn("size-1.5 rounded-full bg-cyan-400", due && "animate-ping")}
							style={{ backgroundColor: "#38bdf8" }}
						/>
						<span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
							{due ? t("hydration.reminder") : paused ? t("hydration.paused") : t("hydration.next")}
						</span>
					</div>
					{intake >= goal && (
						<span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-400">
							<SparklesIcon size={11} />
							<span>Goal Met!</span>
						</span>
					)}
				</div>

				{/* Primary Countdown / Headline */}
				<div className="flex items-baseline gap-2">
					<span className="text-[23px]/[1.15] font-bold tracking-tight text-text tabular-nums">
						{due
							? t("hydration.titleDue")
							: running
								? remainingLabel(deadline, now)
								: (pausedLabel ?? t("hydration.paused"))}
					</span>
				</div>

				{/* Daily Intake Goal Progress Bar & Log Chip */}
				<div className="mt-0.5 flex items-center gap-2.5">
					<div className="h-1.5 w-36 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
						<div
							className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 transition-all duration-500 ease-out"
							style={{ width: `${progressPct}%` }}
						/>
					</div>

					<span className="text-[11px] font-medium text-text-dim tabular-nums">
						{t("hydration.glasses", { count: intake, total: goal })}
					</span>

					<button
						type="button"
						onClick={() => addGlass(1)}
						title={t("hydration.logGlass")}
						className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 transition-all hover:bg-cyan-400/20 hover:scale-105 active:scale-95 cursor-pointer"
					>
						<PlusIcon size={10} strokeWidth={3} />
						<span>{t("hydration.logGlass")}</span>
					</button>
				</div>
			</div>

			{/* Right Column: Fluid Action Buttons */}
			<div className="flex flex-none items-center gap-2">
				{due ? (
					<>
						<button
							type="button"
							onClick={onSnooze}
							className="flex h-9 items-center rounded-xl border border-hairline bg-card/80 px-3.5 text-[12px] font-semibold text-text-dim backdrop-blur-md transition-all hover:bg-card hover:text-text active:scale-95 cursor-pointer"
						>
							{t("hydration.snooze.action")}
						</button>
						<button
							type="button"
							onClick={handleConfirm}
							className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 text-[12px] font-bold text-white shadow-[0_2px_12px_rgba(14,165,233,0.35)] transition-all hover:brightness-110 active:scale-95 cursor-pointer"
						>
							<CheckIcon size={14} strokeWidth={2.5} />
							<span>{t("hydration.confirm")}</span>
						</button>
					</>
				) : running ? (
					<button
						type="button"
						onClick={onPause}
						className="flex h-9 items-center gap-1.5 rounded-xl border border-hairline bg-card/80 px-3.5 text-[12px] font-semibold text-text-dim backdrop-blur-md transition-all hover:bg-card hover:text-text active:scale-95 cursor-pointer"
					>
						<PauseIcon size={13} fill="currentColor" />
						<span>{t("hydration.pause")}</span>
					</button>
				) : paused ? (
					<>
						<button
							type="button"
							onClick={onStart}
							title={t("hydration.reset")}
							className="grid size-9 place-items-center rounded-xl border border-hairline bg-card/80 text-text-dim backdrop-blur-md transition-all hover:bg-card hover:text-text active:scale-95 cursor-pointer"
						>
							<RotateCcwIcon size={13} />
						</button>
						<button
							type="button"
							onClick={onResume}
							className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 text-[12px] font-bold text-white shadow-[0_2px_12px_rgba(14,165,233,0.35)] transition-all hover:brightness-110 active:scale-95 cursor-pointer"
						>
							<PlayIcon size={13} fill="currentColor" />
							<span>{t("hydration.resume")}</span>
						</button>
					</>
				) : (
					<button
						type="button"
						onClick={onStart}
						className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 text-[12px] font-bold text-white shadow-[0_2px_12px_rgba(14,165,233,0.35)] transition-all hover:brightness-110 active:scale-95 cursor-pointer"
					>
						<PlayIcon size={13} fill="currentColor" />
						<span>{t("hydration.start")}</span>
					</button>
				)}
			</div>
		</div>
	);
}
