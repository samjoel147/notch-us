import { ActivityIcon, AlertTriangleIcon, CpuIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../../../core/cn";
import type { Activity } from "../../types";

export function ResourceAlertLeft({ activity: a }: { activity: Activity }) {
	const progress = Math.max(0, Math.min(1, a.progress ?? 0.9));
	const percent = Math.round(progress * 100);
	const isCritical = percent >= 95;
	const isRam =
		a.id.includes("ram") || a.title?.toLowerCase().includes("ram") || a.title?.toLowerCase().includes("memory");

	return (
		<div className="flex items-center gap-2.5 min-w-0">
			<div className="relative flex-none">
				<motion.div
					className={cn("absolute inset-0 rounded-full", isCritical ? "bg-[#FF453A]/30" : "bg-[#FF9F0A]/25")}
					animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
					transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
				/>
				<motion.div
					className={cn(
						"relative grid size-7 place-items-center rounded-full shadow-sm",
						isCritical ? "bg-[#FF453A]/20 text-[#FF453A]" : "bg-[#FF9F0A]/20 text-[#FF9F0A]",
					)}
					initial={{ scale: 0.85 }}
					animate={{ scale: [1, 1.08, 1] }}
					transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
				>
					{isCritical ? (
						<AlertTriangleIcon size={14} className="stroke-[2.2]" />
					) : isRam ? (
						<ActivityIcon size={14} className="stroke-[2.2]" />
					) : (
						<CpuIcon size={14} className="stroke-[2.2]" />
					)}
				</motion.div>
			</div>

			<div className="flex min-w-0 flex-col leading-tight">
				<span className="truncate text-[12.5px] font-[650] text-text">
					{a.title || (isRam ? "High Memory Load" : "High CPU Load")}
				</span>
				<span className="truncate text-[11px] font-medium text-text-dim">
					{a.subtitle || "Resource spike detected"}
				</span>
			</div>
		</div>
	);
}

export function ResourceAlertRight({ activity: a }: { activity: Activity }) {
	const progress = Math.max(0, Math.min(1, a.progress ?? 0.9));
	const percent = Math.round(progress * 100);
	const isCritical = percent >= 95;
	const isRam =
		a.id.includes("ram") || a.title?.toLowerCase().includes("ram") || a.title?.toLowerCase().includes("memory");

	return (
		<div className="flex items-center gap-1.5 flex-none pl-2">
			<div
				className={cn(
					"flex items-center gap-1 rounded-full px-2.5 py-0.5 border font-mono text-[12px] font-black tabular-nums tracking-tight",
					isCritical
						? "bg-[#FF453A]/15 border-[#FF453A]/40 text-danger shadow-[0_0_8px_rgba(255,69,58,0.25)]"
						: "bg-[#FF9F0A]/15 border-[#FF9F0A]/35 text-warn",
				)}
			>
				<span className="text-[10px] uppercase font-bold tracking-wider">{isRam ? "RAM" : "CPU"}</span>
				<span>{percent}%</span>
			</div>
		</div>
	);
}

export function ResourceAlert({ activity: a }: { activity: Activity }) {
	return (
		<div className="flex h-full w-full items-center justify-between px-3 select-none gap-3">
			<ResourceAlertLeft activity={a} />
			<ResourceAlertRight activity={a} />
		</div>
	);
}
