import { BatteryIcon, BatteryWarningIcon, LeafIcon, ZapIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../../../core/cn";
import type { Activity } from "../../types";

export function BatteryAlertLeft({ activity: a }: { activity: Activity }) {
	const progress = Math.max(0, Math.min(1, a.progress ?? 0.5));
	const percent = Math.round(progress * 100);
	const isCharging = a.icon === "charging" || a.id.includes("charging") || a.title?.toLowerCase().includes("charging");
	const isPowerSaver = a.id.includes("power_saver") || a.icon === "leaf";
	const isLow = percent <= 20 && !isCharging;
	const isCritical = percent <= 10 && !isCharging;

	if (isPowerSaver) {
		return (
			<div className="flex items-center gap-2.5 min-w-0">
				<motion.div
					className="grid size-6.5 place-items-center rounded-full bg-[#34C759]/20 text-[#34C759] shadow-[0_0_12px_rgba(52,199,89,0.35)]"
					initial={{ scale: 0.8, rotate: -15 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ type: "spring", stiffness: 400, damping: 25 }}
				>
					<LeafIcon size={14} className="fill-[currentColor]" />
				</motion.div>
				<span className="text-[13px] font-[650] tracking-tight text-text truncate max-w-40">
					{a.title || "Battery Saver"}
				</span>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2.5 min-w-0">
			<div className="relative flex-none">
				{isCharging ? (
					<motion.div
						className="relative grid size-7 place-items-center rounded-full bg-[#30D158]/20 text-[#30D158] shadow-[0_0_14px_rgba(48,209,88,0.4)]"
						initial={{ scale: 0.85 }}
						animate={{ scale: [1, 1.08, 1] }}
						transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
					>
						<ZapIcon size={14} className="fill-[currentColor]" />
					</motion.div>
				) : isCritical ? (
					<motion.div
						className="grid size-7 place-items-center rounded-full bg-[#FF453A]/20 text-[#FF453A] shadow-[0_0_14px_rgba(255,69,58,0.45)]"
						animate={{ scale: [1, 1.15, 1] }}
						transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
					>
						<BatteryWarningIcon size={15} />
					</motion.div>
				) : isLow ? (
					<div className="grid size-7 place-items-center rounded-full bg-[#FF9F0A]/20 text-[#FF9F0A]">
						<BatteryWarningIcon size={15} />
					</div>
				) : (
					<div className="grid size-7 place-items-center rounded-full bg-white/10 text-text">
						<BatteryIcon size={15} />
					</div>
				)}
			</div>

			<div className="flex min-w-0 flex-col leading-tight">
				<span className="truncate text-[13px] font-[650] text-text">
					{a.title || (isCharging ? "Charging" : isCritical ? "Critical Battery" : isLow ? "Low Battery" : "Battery")}
				</span>
				{a.subtitle && <span className="truncate text-[11px] font-medium text-text-dim">{a.subtitle}</span>}
			</div>
		</div>
	);
}

export function BatteryAlertRight({ activity: a }: { activity: Activity }) {
	const progress = Math.max(0, Math.min(1, a.progress ?? 0.5));
	const percent = Math.round(progress * 100);
	const isCharging = a.icon === "charging" || a.id.includes("charging") || a.title?.toLowerCase().includes("charging");
	const isPowerSaver = a.id.includes("power_saver") || a.icon === "leaf";
	const isLow = percent <= 20 && !isCharging;
	const isCritical = percent <= 10 && !isCharging;

	const accentColor = isCritical ? "#FF453A" : isLow ? "#FF9F0A" : "#30D158";

	if (isPowerSaver) {
		return (
			<span className="rounded-full bg-ok/15 border border-ok/30 px-2.5 py-0.5 text-[11px] font-bold text-ok">
				{a.subtitle || "Active"}
			</span>
		);
	}

	return (
		<div className="flex items-center gap-2 flex-none pl-2">
			{/* Apple-style Battery Shell */}
			<div className="relative flex h-4 w-8 items-center rounded-[5px] border-[1.5px] border-text/60 p-[1.5px]">
				<motion.div
					className="h-full rounded-[2.5px]"
					style={{ backgroundColor: accentColor }}
					initial={{ width: 0 }}
					animate={{ width: `${Math.max(8, percent)}%` }}
					transition={{ type: "spring", stiffness: 350, damping: 28 }}
				/>
				{/* Battery nipple */}
				<div className="absolute -right-1 top-1 h-1.5 w-[2.5px] rounded-r-xs bg-text/60" />
			</div>

			<span
				className={cn(
					"min-w-8 text-right font-mono text-[13px] font-black tabular-nums tracking-tight",
					isCritical ? "text-danger" : isLow ? "text-warn" : "text-text",
				)}
			>
				{percent}%
			</span>
		</div>
	);
}

export function BatteryAlert({ activity: a }: { activity: Activity }) {
	return (
		<div className="flex h-full w-full items-center justify-between px-2.5 select-none">
			<BatteryAlertLeft activity={a} />
			<BatteryAlertRight activity={a} />
		</div>
	);
}
