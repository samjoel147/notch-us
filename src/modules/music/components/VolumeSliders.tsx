import { MonitorIcon, MusicIcon, SlidersHorizontalIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "../../../core/cn";
import { useT } from "../../../core/i18n";
import { useIsland } from "../../../core/island";
import { type MusicState, setVolume, type Volume } from "../hooks/useMusic";

/** How long a change made here wins over the backend's (it polls every 0.5–1 s). */
const HOLD_MS = 1500;
const KEY_STEP = 0.05;

/** Two small sliders for the panel's footer: the player's, then the computer's, plus other apps mixer. */
export function VolumeSliders({ music }: { music: MusicState | undefined }) {
	const t = useT();
	const [showMixer, setShowMixer] = useState(false);
	if (!music?.available) return null;

	const otherApps = (music.apps ?? []).filter((app) => {
		const appName = music.appName?.toLowerCase() || "";
		const currentStem = music.appId?.toLowerCase() || "";
		const targetName = app.name.toLowerCase();
		return !appName.includes(targetName) && !currentStem.includes(targetName);
	});

	return (
		<div className="relative flex items-center gap-1.5">
			{music.appVolume && (
				<VolumeSlider
					name={music.appDevice ? `${music.appName} · ${music.appDevice}` : music.appName}
					volume={music.appVolume}
					icon={music.appIcon ? <img src={music.appIcon} alt="" draggable={false} /> : <MusicIcon size={12} />}
					onChange={(change) => setVolume({ target: "app", appId: music.appId, ...change })}
				/>
			)}

			{music.volume && (
				<VolumeSlider
					name={t("music.computer")}
					volume={music.volume}
					icon={<MonitorIcon size={13} />}
					onChange={(change) => setVolume({ target: "system", ...change })}
				/>
			)}

			{otherApps.length > 0 && (
				<button
					type="button"
					className={cn(
						"grid size-6.5 place-items-center rounded-[11px] bg-card shadow-[inset_0_0_0_1px_var(--hairline)] text-text-dim transition-[opacity,color,background,transform] duration-200 hover:bg-white/12 hover:text-text active:scale-92",
						showMixer && "bg-white/20 text-text",
					)}
					title={t("music.mixer") || "Audio mixer"}
					onClick={() => setShowMixer((v) => !v)}
				>
					<SlidersHorizontalIcon size={12} />
				</button>
			)}

			{showMixer && otherApps.length > 0 && (
				<div className="absolute right-0 bottom-full mb-2 flex max-h-48 w-56 flex-col gap-1.5 overflow-y-auto rounded-2xl bg-island/95 p-2 shadow-2xl backdrop-blur-xl border border-hairline z-50">
					<span className="px-1.5 text-[11px] font-semibold text-text-faint">
						{t("music.otherApps") || "Other apps"}
					</span>
					{otherApps.map((app) => (
						<VolumeSlider
							key={app.pid}
							name={app.name}
							volume={{ level: app.level, muted: app.muted }}
							icon={
								app.icon ? (
									<img src={app.icon} alt="" draggable={false} className="size-3.5" />
								) : (
									<MusicIcon size={12} />
								)
							}
							onChange={(change) => setVolume({ target: "pid", pid: app.pid, ...change })}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export function VolumeSlider({
	name,
	volume,
	icon,
	onChange,
}: {
	name: string;
	volume: Volume;
	icon: ReactNode;
	onChange: (change: Partial<Volume>) => void;
}) {
	const t = useT();
	const island = useIsland();
	// What the user just set, shown until the backend has caught up.
	const [local, setLocal] = useState<Volume | null>(null);
	const holdTimer = useRef<number | undefined>(undefined);
	useEffect(() => () => window.clearTimeout(holdTimer.current), []);
	const shown = local ?? volume;

	const change = (next: Partial<Volume>) => {
		setLocal({ ...shown, ...next });
		window.clearTimeout(holdTimer.current);
		holdTimer.current = window.setTimeout(() => setLocal(null), HOLD_MS);
		onChange(next);
	};
	// Turning a muted slider up unmutes it, like the Windows mixer.
	const setLevel = (level: number) => {
		level = Math.round(Math.min(1, Math.max(0, level)) * 100) / 100;
		if (level === shown.level && !(shown.muted && level > 0)) return;
		change(shown.muted && level > 0 ? { level, muted: false } : { level });
	};
	const slide = (e: React.PointerEvent<HTMLDivElement>) => {
		const r = e.currentTarget.getBoundingClientRect();
		setLevel((e.clientX - r.left) / r.width);
	};

	const percent = Math.round(shown.level * 100);
	return (
		<div
			className="flex h-6.5 min-w-0 flex-[0_1_auto] items-center gap-1.25 rounded-[13px] bg-card shadow-[inset_0_0_0_1px_var(--hairline)] pr-2.25 pl-1"
			onClick={(e) => e.stopPropagation()}
		>
			<button
				type="button"
				className={cn(
					"grid size-4.5 place-items-center text-text-dim transition-[opacity,color,transform] duration-200 hover:text-text active:scale-88 [&_img]:size-3.5",
					shown.muted && "opacity-45",
				)}
				title={t(shown.muted ? "music.unmute" : "music.mute", { name })}
				onClick={() => change({ muted: !shown.muted })}
			>
				{icon}
			</button>

			<div
				className="group/track flex h-full w-16 min-w-7 flex-[0_1_auto] cursor-pointer touch-none items-center outline-none"
				role="slider"
				tabIndex={0}
				title={`${name} · ${percent}%`}
				aria-label={t("music.volume", { name })}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percent}
				onPointerDown={(e) => {
					e.currentTarget.setPointerCapture(e.pointerId);
					// The pointer may wander off the island mid-drag.
					island.keepOpen(true, "volume");
					slide(e);
				}}
				onPointerMove={(e) => {
					if (e.currentTarget.hasPointerCapture(e.pointerId)) slide(e);
				}}
				onLostPointerCapture={() => island.keepOpen(false, "volume")}
				onKeyDown={(e) => {
					const step = { ArrowRight: KEY_STEP, ArrowUp: KEY_STEP, ArrowLeft: -KEY_STEP, ArrowDown: -KEY_STEP }[e.key];
					if (step === undefined) return;
					e.preventDefault();
					setLevel(shown.level + step);
				}}
			>
				<div className="relative h-1 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/16 transition-[height] duration-200 ease-[ease] group-hover/track:h-1.5 group-focus-visible/track:h-1.5">
					<div
						className={cn(
							"absolute inset-0 origin-left rounded-[inherit] bg-text transition-transform duration-120 ease-out",
							shown.muted && "opacity-40",
						)}
						style={{ transform: `scaleX(${shown.level})` }}
					/>
				</div>
			</div>
		</div>
	);
}
