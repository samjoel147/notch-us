import { FlameIcon, TimerIcon } from "lucide-react";
import { cn } from "../../../core/cn";
import type { PomodoroTimer } from "../types";

function formatMinutesSeconds(ms: number): string {
	const totalSec = Math.max(0, Math.ceil(ms / 1000));
	const mins = Math.floor(totalSec / 60);
	const secs = String(totalSec % 60).padStart(2, "0");
	return `${mins}:${secs}`;
}

export function PomodoroBubble({ timer }: { timer: PomodoroTimer }) {
	const isWork = timer.phase === "work";
	const isLong = timer.phase === "longBreak";
	const colorClass = isWork ? "text-[#FF6358]" : isLong ? "text-[#5E5CE6]" : "text-[#30D158]";
	const bgClass = isWork ? "bg-[#FF6358]/15" : isLong ? "bg-[#5E5CE6]/15" : "bg-[#30D158]/15";

	return (
		<span
			className={cn(
				"grid h-8.5 min-w-8.5 place-items-center rounded-full px-1.5 text-[10.5px] font-[750] tracking-[-0.03em] tabular-nums",
				colorClass,
				bgClass,
				timer.done && "animate-pulse brightness-125",
			)}
		>
			{timer.running ? (
				<span>{formatMinutesSeconds(timer.remaining)}</span>
			) : timer.done ? (
				<TimerIcon size={14} className="animate-spin" />
			) : timer.rounds > 0 ? (
				<span className="flex items-center gap-0.5">
					<FlameIcon size={12} className="fill-[currentColor]" />
					{timer.rounds}
				</span>
			) : (
				<TimerIcon size={14} />
			)}
		</span>
	);
}
