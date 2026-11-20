import { motion } from "motion/react";
import { cn } from "../../../../core/cn";
import type { Activity } from "../../types";

export function LockKeyAlertLeft({ activity: a }: { activity: Activity }) {
	const isNumLock = a.id.includes("num") || a.title?.toLowerCase().includes("num");
	const isOn =
		a.subtitle?.toLowerCase().includes("on") ||
		a.subtitle?.toLowerCase().includes("active") ||
		a.title?.toLowerCase().includes("on") ||
		a.icon === "lock_on";

	const keyLabel = isNumLock ? "Num" : "Caps";
	const keySymbol = isNumLock ? "1" : "⇪";

	return (
		<div className="flex items-center gap-2.5 min-w-0">
			<motion.div
				className="relative flex h-7.5 items-center gap-1.5 rounded-lg bg-gradient-to-b from-white/20 to-white/5 px-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.35)] border border-white/20"
				initial={{ scale: 0.88, y: -2 }}
				animate={{ scale: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 500, damping: 25 }}
			>
				<span className="font-mono text-[12px] font-black tracking-wider text-text flex items-center gap-1">
					<span>{keySymbol}</span>
					<span className="text-[10.5px] uppercase font-bold text-text-dim">{keyLabel}</span>
				</span>

				<div className="relative flex items-center justify-center pl-0.5">
					<motion.div
						className={cn(
							"size-2 rounded-full transition-all duration-300",
							isOn ? "bg-[#30D158] shadow-[0_0_8px_#30D158,0_0_14px_rgba(48,209,88,0.7)]" : "bg-white/20 shadow-inner",
						)}
						animate={{
							scale: isOn ? [1, 1.15, 1] : 1,
						}}
						transition={{ duration: 0.3 }}
					/>
				</div>
			</motion.div>

			<span className="text-[13px] font-[650] text-text">{isNumLock ? "Num Lock" : "Caps Lock"}</span>
		</div>
	);
}

export function LockKeyAlertRight({ activity: a }: { activity: Activity }) {
	const isOn =
		a.subtitle?.toLowerCase().includes("on") ||
		a.subtitle?.toLowerCase().includes("active") ||
		a.title?.toLowerCase().includes("on") ||
		a.icon === "lock_on";

	return (
		<motion.div
			initial={{ scale: 0.9 }}
			animate={{ scale: 1 }}
			className={cn(
				"rounded-full px-2.5 py-0.5 text-[11px] font-black tracking-wide uppercase border transition-colors flex-none",
				isOn ? "bg-[#30D158]/15 border-[#30D158]/40 text-[#30D158]" : "bg-white/10 border-white/15 text-text-dim",
			)}
		>
			{isOn ? "Active" : "Off"}
		</motion.div>
	);
}

export function LockKeyAlert({ activity: a }: { activity: Activity }) {
	return (
		<div className="flex h-full w-full items-center justify-between px-3 select-none gap-3">
			<LockKeyAlertLeft activity={a} />
			<LockKeyAlertRight activity={a} />
		</div>
	);
}
