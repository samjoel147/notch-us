import { WifiIcon, WifiOffIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../../../core/cn";
import type { Activity } from "../../types";

export function WifiAlertLeft({ activity: a }: { activity: Activity }) {
	const isDisconnected =
		a.id.includes("disconnect") || a.title?.toLowerCase().includes("disconnected") || a.icon === "wifi_off";
	const ssid = a.subtitle || a.title || "Wi-Fi";

	return (
		<div className="flex items-center gap-2.5 min-w-0">
			<div className="relative flex-none">
				{!isDisconnected && (
					<motion.div
						className="absolute inset-0 rounded-full bg-[#007AFF]/25"
						initial={{ scale: 0.8, opacity: 0.9 }}
						animate={{ scale: [0.8, 1.5, 0.8], opacity: [0.8, 0, 0.8] }}
						transition={{ repeat: Infinity, duration: 2.4, ease: "easeOut" }}
					/>
				)}
				<motion.div
					className={cn(
						"relative grid size-7 place-items-center rounded-full shadow-sm",
						isDisconnected ? "bg-red-500/20 text-danger" : "bg-[#007AFF]/20 text-[#007AFF]",
					)}
					initial={{ scale: 0.85 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 450, damping: 25 }}
				>
					{isDisconnected ? (
						<WifiOffIcon size={14} className="stroke-[2.2]" />
					) : (
						<WifiIcon size={14} className="stroke-[2.2]" />
					)}
				</motion.div>
			</div>

			<div className="flex min-w-0 flex-col leading-tight">
				<span className="truncate text-[12.5px] font-[650] text-text" title={ssid}>
					{ssid}
				</span>
				<span
					className={cn(
						"flex items-center gap-1 text-[11px] font-medium",
						isDisconnected ? "text-danger" : "text-[#007AFF]",
					)}
				>
					<span className={cn("size-1.5 rounded-full", isDisconnected ? "bg-danger" : "bg-[#007AFF] animate-pulse")} />
					{isDisconnected ? "Disconnected" : "Connected"}
				</span>
			</div>
		</div>
	);
}

export function WifiAlertRight({ activity: a }: { activity: Activity }) {
	const isDisconnected =
		a.id.includes("disconnect") || a.title?.toLowerCase().includes("disconnected") || a.icon === "wifi_off";

	return (
		<div className="flex items-center gap-1.5 flex-none pl-2">
			{!isDisconnected ? (
				<div className="flex items-end gap-0.5 h-3.5 px-2 py-0.5 rounded-full bg-white/10 border border-hairline">
					<span className="w-1 h-1.5 rounded-xs bg-[#007AFF]" />
					<span className="w-1 h-2 rounded-xs bg-[#007AFF]" />
					<span className="w-1 h-2.5 rounded-xs bg-[#007AFF]" />
					<span className="w-1 h-3 rounded-xs bg-[#007AFF]" />
				</div>
			) : (
				<span className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-danger">
					Offline
				</span>
			)}
		</div>
	);
}

export function WifiAlert({ activity: a }: { activity: Activity }) {
	return (
		<div className="flex h-full w-full items-center justify-between px-3 select-none gap-3">
			<WifiAlertLeft activity={a} />
			<WifiAlertRight activity={a} />
		</div>
	);
}
