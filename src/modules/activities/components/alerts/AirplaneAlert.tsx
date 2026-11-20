import { PlaneIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../../../core/cn";
import type { Activity } from "../../types";

export function AirplaneAlertLeft({ activity: a }: { activity: Activity }) {
	const isActive = !a.title?.toLowerCase().includes("off") && !a.subtitle?.toLowerCase().includes("off");

	return (
		<div className="flex items-center gap-2.5 min-w-0">
			<div className="relative flex-none">
				{isActive && (
					<motion.div
						className="absolute inset-0 rounded-full bg-[#FF9F0A]/20"
						initial={{ scale: 0.8 }}
						animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.8, 0, 0.8] }}
						transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
					/>
				)}
				<motion.div
					className={cn(
						"relative grid size-7 place-items-center rounded-full shadow-sm",
						isActive ? "bg-[#FF9F0A]/20 text-[#FF9F0A]" : "bg-white/10 text-text-dim",
					)}
					initial={{ x: -6, opacity: 0.6 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ type: "spring", stiffness: 420, damping: 25 }}
				>
					<motion.div
						animate={{ y: isActive ? [-1, 1, -1] : 0 }}
						transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
					>
						<PlaneIcon size={14} className="stroke-[2.2] -rotate-45" />
					</motion.div>
				</motion.div>
			</div>

			<div className="flex min-w-0 flex-col leading-tight">
				<span className="truncate text-[12.5px] font-[650] text-text">{a.title || "Flight Mode"}</span>
				<span className="text-[11px] font-medium text-text-dim">
					{isActive ? "Wireless radios off" : "Radios restored"}
				</span>
			</div>
		</div>
	);
}

export function AirplaneAlertRight({ activity: a }: { activity: Activity }) {
	const isActive = !a.title?.toLowerCase().includes("off") && !a.subtitle?.toLowerCase().includes("off");

	return (
		<div className="flex items-center flex-none pl-2">
			<span
				className={cn(
					"rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight border",
					isActive ? "bg-[#FF9F0A]/15 border-[#FF9F0A]/35 text-[#FF9F0A]" : "bg-white/10 border-white/15 text-text-dim",
				)}
			>
				{isActive ? "Active" : "Off"}
			</span>
		</div>
	);
}

export function AirplaneAlert({ activity: a }: { activity: Activity }) {
	return (
		<div className="flex h-full w-full items-center justify-between px-3 select-none gap-3">
			<AirplaneAlertLeft activity={a} />
			<AirplaneAlertRight activity={a} />
		</div>
	);
}
