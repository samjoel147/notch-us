import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../../../core/cn";
import type { Activity } from "../../types";

export function VolumeAlertLeft({ activity: a }: { activity: Activity }) {
	const progress = Math.max(0, Math.min(1, a.progress ?? 0));
	const percent = Math.round(progress * 100);
	const isMuted = a.icon === "mute" || percent === 0 || a.title?.toLowerCase().includes("muted");

	return (
		<div className="flex items-center gap-2 flex-none">
			<motion.div
				key={isMuted ? "muted" : "active"}
				initial={{ scale: 0.85, rotate: -8 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{ type: "spring", stiffness: 500, damping: 30 }}
				className={cn(
					"grid size-7 place-items-center rounded-full transition-colors",
					isMuted ? "bg-red-500/20 text-danger" : "bg-white/10 text-text",
				)}
			>
				{isMuted ? <VolumeXIcon size={15} /> : <Volume2Icon size={15} />}
			</motion.div>
			<span className="text-[12.5px] font-bold text-text truncate max-w-28">
				{isMuted ? "Muted" : a.title || "Volume"}
			</span>
		</div>
	);
}

export function VolumeAlertRight({ activity: a }: { activity: Activity }) {
	const progress = Math.max(0, Math.min(1, a.progress ?? 0));
	const percent = Math.round(progress * 100);
	const isMuted = a.icon === "mute" || percent === 0 || a.title?.toLowerCase().includes("muted");

	return (
		<div className="flex items-center gap-2.5 flex-1 max-w-44 min-w-24">
			<div className="relative h-2 w-full flex-1 overflow-hidden rounded-full bg-white/15 p-[1px]">
				<motion.div
					className={cn(
						"h-full rounded-full transition-colors duration-200",
						isMuted ? "bg-red-500/50" : "bg-accent shadow-[0_0_8px_var(--tab-accent,rgba(56,189,248,0.5))]",
					)}
					initial={false}
					animate={{ width: `${isMuted ? 0 : percent}%` }}
					transition={{ type: "spring", stiffness: 550, damping: 35 }}
				/>
			</div>
			<span
				className={cn(
					"w-7 text-right font-mono text-[12px] font-black tabular-nums tracking-tight flex-none",
					isMuted ? "text-danger" : "text-text",
				)}
			>
				{isMuted ? "0%" : `${percent}%`}
			</span>
		</div>
	);
}

export function VolumeAlert({ activity: a }: { activity: Activity }) {
	return (
		<div className="flex h-full w-full items-center justify-between px-3 select-none gap-3">
			<VolumeAlertLeft activity={a} />
			<VolumeAlertRight activity={a} />
		</div>
	);
}
