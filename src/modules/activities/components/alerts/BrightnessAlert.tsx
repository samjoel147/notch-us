import { SunIcon, SunMediumIcon } from "lucide-react";
import { motion } from "motion/react";
import type { Activity } from "../../types";

export function BrightnessAlertLeft({ activity: a }: { activity: Activity }) {
	const progress = Math.max(0, Math.min(1, a.progress ?? 0.5));
	const percent = Math.round(progress * 100);

	return (
		<div className="flex items-center gap-2 flex-none">
			<motion.div
				key="sun"
				initial={{ scale: 0.85, rotate: -20 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{ type: "spring", stiffness: 480, damping: 26 }}
				className="grid size-7 place-items-center rounded-full bg-[#FFD60A]/20 text-[#FFD60A] shadow-[0_0_12px_rgba(255,214,10,0.35)]"
			>
				{percent > 50 ? <SunIcon size={15} /> : <SunMediumIcon size={15} />}
			</motion.div>
			<span className="text-[12.5px] font-bold text-text truncate max-w-28">{a.title || "Brightness"}</span>
		</div>
	);
}

export function BrightnessAlertRight({ activity: a }: { activity: Activity }) {
	const progress = Math.max(0, Math.min(1, a.progress ?? 0.5));
	const percent = Math.round(progress * 100);

	return (
		<div className="flex items-center gap-2.5 flex-1 max-w-44 min-w-24">
			<div className="relative h-2 w-full flex-1 overflow-hidden rounded-full bg-white/15 p-[1px]">
				<motion.div
					className="h-full rounded-full bg-[#FFD60A] shadow-[0_0_10px_rgba(255,214,10,0.6)]"
					initial={false}
					animate={{ width: `${percent}%` }}
					transition={{ type: "spring", stiffness: 520, damping: 34 }}
				/>
			</div>
			<span className="w-8 text-right font-mono text-[12px] font-black tabular-nums tracking-tight flex-none text-[#FFD60A]">
				{percent}%
			</span>
		</div>
	);
}

export function BrightnessAlert({ activity: a }: { activity: Activity }) {
	return (
		<div className="flex h-full w-full items-center justify-between px-3 select-none gap-3">
			<BrightnessAlertLeft activity={a} />
			<BrightnessAlertRight activity={a} />
		</div>
	);
}
