import { Mic, MicOff, Video } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "../../../components/Glyph";
import { providerAction, useProvider } from "../../../core/bridge";
import { cn } from "../../../core/cn";
import { useIsland } from "../../../core/island";
import { ACTIVITIES_PROVIDER, type ActivitiesState, type Activity } from "../types";

/** Opens what an activity points to: its link or app, or the module it came from. */
export function useOpenActivity() {
	const island = useIsland();
	return (a: Activity) => {
		if (a.source === "ask") island.expand("ask");
		else if (a.action) providerAction(ACTIVITIES_PROVIDER, "open", a.id);
	};
}

export function PrivacyCard({ activity: a }: { activity: Activity }) {
	const state = useProvider<ActivitiesState>(ACTIVITIES_PROVIDER);
	const privacy = state?.privacy;
	const micMuted = privacy?.micMuted ?? false;
	const apps = privacy?.apps ?? [];

	const handleToggleMute = (e: React.MouseEvent) => {
		e.stopPropagation();
		providerAction(ACTIVITIES_PROVIDER, "toggleMic");
	};

	return (
		<div className="flex flex-col gap-2.5 rounded-[16px] bg-card p-3 border border-hairline">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2.5 min-w-0">
					<Badge icon={a.icon} image={a.image} color={a.color ?? "#ffffff"} size={36} />
					<div className="flex min-w-0 flex-col">
						<span className="truncate text-[14px] font-[650] text-text">{a.title}</span>
						<span className="truncate text-[12px] text-text-dim">
							{micMuted ? "Microphone input muted" : (a.subtitle ?? "Active audio/video capture")}
						</span>
					</div>
				</div>

				<button
					type="button"
					onClick={handleToggleMute}
					className={cn(
						"flex flex-none items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all duration-200 cursor-pointer active:scale-95",
						micMuted
							? "bg-red-500/20 text-danger border border-red-500/30 hover:bg-red-500/30"
							: "bg-surface-control text-text hover:bg-white/15 border border-hairline",
					)}
					title="Click or press Alt+M to toggle mute"
				>
					{micMuted ? <MicOff size={13} className="text-danger" /> : <Mic size={13} className="text-warn" />}
					<span>{micMuted ? "Unmute Mic" : "Mute Mic"}</span>
					<kbd className="ml-1 rounded bg-white/10 px-1 py-0.5 font-mono text-[9.5px] text-text-dim">Alt+M</kbd>
				</button>
			</div>

			{apps.length > 0 && (
				<div className="flex flex-col gap-1.5 pt-2 border-t border-hairline/60">
					<span className="text-[10.5px] font-bold uppercase tracking-wider text-text-dim">Capturing Applications</span>
					<div className="flex flex-wrap gap-1.5">
						{apps.map((app) => (
							<div
								key={`${app.pid}-${app.name}`}
								className="flex items-center gap-1.5 rounded-lg bg-surface-control px-2 py-1 border border-hairline/60"
							>
								{app.icon ? (
									<img src={app.icon} alt="" className="size-4 rounded object-contain" />
								) : app.kind === "camera" ? (
									<Video size={13} className="text-ok" />
								) : (
									<Mic size={13} className="text-warn" />
								)}
								<span className="text-[12px] font-medium text-text">{app.name}</span>
								<span
									className={cn(
										"rounded px-1.5 py-0.5 text-[9.5px] font-semibold",
										app.kind === "camera" ? "bg-ok/20 text-ok" : "bg-warn/20 text-warn",
									)}
								>
									{app.kind === "camera" ? "Camera" : "Mic"}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

/** One activity, large: badge, caption, title, subtitle and progress. */
export function ActivityCard({ activity: a, compact = false }: { activity: Activity; compact?: boolean }) {
	const open = useOpenActivity();
	if (a.source === "privacy" && a.id === "privacy-mic") {
		return <PrivacyCard activity={a} />;
	}
	const color = a.color ?? "#ffffff";
	const clickable = !!a.action || a.source === "ask";
	return (
		<div
			className={cn(
				"relative flex items-start gap-3.5 rounded-[14px] px-1 py-1.5",
				compact && "items-center gap-3 px-2",
				clickable && "cursor-pointer hover:bg-white/5",
			)}
			onClick={(e) => {
				if (!clickable) return;
				e.stopPropagation();
				open(a);
			}}
		>
			<Badge icon={a.icon} image={a.image} color={color} size={compact ? 34 : 46} />
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				{a.caption && <span className="text-[11.5px] font-bold text-text-dim">{a.caption}</span>}
				<span className={cn("truncate text-[15px] font-[650]", compact && "text-[13.5px]")}>{a.title || " "}</span>
				{a.subtitle && (
					<span className={cn("line-clamp-2 text-[13px]/[1.35] text-text-dim", compact && "line-clamp-1 text-[12px]")}>
						{a.subtitle}
					</span>
				)}
				{a.progress != null && (
					<div className="mt-2 flex items-center gap-2.5">
						<div className="relative h-1.25 flex-1 overflow-hidden rounded-full bg-surface-control border border-hairline/40">
							<motion.div
								className="absolute inset-0 origin-left rounded-[inherit]"
								style={{ background: color }}
								initial={false}
								animate={{ scaleX: Math.min(1, Math.max(0, a.progress)) }}
								transition={{ type: "spring", stiffness: 260, damping: 30 }}
							/>
						</div>
						<span className="text-[12px] font-semibold text-text-dim tabular-nums">
							{Math.round(a.progress * 100)}%
						</span>
					</div>
				)}
			</div>
			{!compact && a.expiresAt == null && (
				<button
					type="button"
					className="size-5.5 flex-none rounded-full text-[15px] leading-none text-text-dim hover:bg-card hover:text-text cursor-pointer border border-transparent hover:border-hairline"
					title="×"
					onClick={(e) => {
						e.stopPropagation();
						providerAction(ACTIVITIES_PROVIDER, "remove", a.id);
					}}
				>
					×
				</button>
			)}
		</div>
	);
}
