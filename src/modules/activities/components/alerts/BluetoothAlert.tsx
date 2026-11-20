import { BluetoothConnectedIcon, HeadphonesIcon, MouseIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../../../core/cn";
import type { Activity } from "../../types";

export function BluetoothAlertLeft({ activity: a }: { activity: Activity }) {
	const title = a.title || "Bluetooth Device";
	const lower = title.toLowerCase();
	const isHeadphones =
		lower.includes("airpod") ||
		lower.includes("headphone") ||
		lower.includes("wh-") ||
		lower.includes("buds") ||
		lower.includes("sony");
	const isMouse = lower.includes("mouse") || lower.includes("trackpad") || lower.includes("mx master");

	return (
		<div className="flex items-center gap-2.5 min-w-0">
			<div className="relative flex-none">
				<motion.div
					className="absolute inset-0 rounded-full bg-[#0A84FF]/25"
					initial={{ scale: 0.8, opacity: 0.8 }}
					animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.8, 0, 0.8] }}
					transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
				/>
				<motion.div
					className="relative grid size-7 place-items-center rounded-full bg-[#0A84FF]/20 text-[#0A84FF] shadow-[0_0_12px_rgba(10,132,255,0.4)]"
					initial={{ scale: 0.8, rotate: -12 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ type: "spring", stiffness: 450, damping: 25 }}
				>
					{isHeadphones ? (
						<HeadphonesIcon size={14} className="stroke-[2.2]" />
					) : isMouse ? (
						<MouseIcon size={14} className="stroke-[2.2]" />
					) : (
						<BluetoothConnectedIcon size={14} className="stroke-[2.2]" />
					)}
				</motion.div>
			</div>

			<div className="flex min-w-0 flex-col leading-tight">
				<span className="truncate text-[12.5px] font-[650] text-text" title={title}>
					{title}
				</span>
				<span className="flex items-center gap-1 text-[11px] font-medium text-[#0A84FF]">
					<span className="size-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
					{a.subtitle || "Connected"}
				</span>
			</div>
		</div>
	);
}

export function BluetoothAlertRight({ activity: a }: { activity: Activity }) {
	const hasBattery = a.progress != null;
	const percent = hasBattery ? Math.round((a.progress ?? 0) * 100) : null;
	const isLow = percent != null && percent <= 20;

	return (
		<div className="flex items-center gap-2 flex-none pl-2">
			{percent != null ? (
				<div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 border border-hairline">
					<div className="relative flex h-3.5 w-6 items-center rounded-[3.5px] border-[1.2px] border-text/60 p-[1px]">
						<motion.div
							className="h-full rounded-[1.5px]"
							style={{ backgroundColor: isLow ? "#FF9F0A" : "#30D158" }}
							initial={{ width: 0 }}
							animate={{ width: `${Math.max(10, percent)}%` }}
							transition={{ type: "spring", stiffness: 350, damping: 28 }}
						/>
						<div className="absolute -right-0.5 top-0.5 h-1 w-[1.5px] rounded-r-xs bg-text/60" />
					</div>
					<span className={cn("font-mono text-[11.5px] font-bold tabular-nums", isLow ? "text-warn" : "text-text")}>
						{percent}%
					</span>
				</div>
			) : (
				<span className="rounded-full bg-[#0A84FF]/15 border border-[#0A84FF]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#0A84FF]">
					Ready
				</span>
			)}
		</div>
	);
}

export function BluetoothAlert({ activity: a }: { activity: Activity }) {
	return (
		<div className="flex h-full w-full items-center justify-between px-3 select-none gap-3">
			<BluetoothAlertLeft activity={a} />
			<BluetoothAlertRight activity={a} />
		</div>
	);
}
