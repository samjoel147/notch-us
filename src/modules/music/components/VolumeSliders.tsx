import {
	BluetoothIcon,
	CheckIcon,
	HeadphonesIcon,
	MonitorIcon,
	MusicIcon,
	SlidersHorizontalIcon,
	SpeakerIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "../../../core/cn";
import { useT } from "../../../core/i18n";
import { useIsland } from "../../../core/island";
import { type AudioDeviceKind, type MusicState, setAudioDevice, setVolume, type Volume } from "../hooks/useMusic";

/** How long a change made here wins over the backend's (it polls every 0.5–1 s). */
const HOLD_MS = 1500;
const KEY_STEP = 0.05;

function getDeviceIcon(kind: AudioDeviceKind, size = 13) {
	switch (kind) {
		case "bluetooth":
			return <BluetoothIcon size={size} />;
		case "headphones":
			return <HeadphonesIcon size={size} />;
		case "display":
			return <MonitorIcon size={size} />;
		default:
			return <SpeakerIcon size={size} />;
	}
}

/** Polished volume sliders: player volume, computer master volume, mixer and router. */
export function VolumeSliders({ music }: { music: MusicState | undefined }) {
	const t = useT();
	const [showMixer, setShowMixer] = useState(false);
	const [showDeviceRouter, setShowDeviceRouter] = useState(false);
	const routerRef = useRef<HTMLDivElement>(null);
	const mixerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!showDeviceRouter) return;
		const onPointerDown = (e: PointerEvent) => {
			if (routerRef.current && !routerRef.current.contains(e.target as Node)) {
				setShowDeviceRouter(false);
			}
		};
		window.addEventListener("pointerdown", onPointerDown);
		return () => window.removeEventListener("pointerdown", onPointerDown);
	}, [showDeviceRouter]);

	useEffect(() => {
		if (!showMixer) return;
		const onPointerDown = (e: PointerEvent) => {
			if (mixerRef.current && !mixerRef.current.contains(e.target as Node)) {
				setShowMixer(false);
			}
		};
		window.addEventListener("pointerdown", onPointerDown);
		return () => window.removeEventListener("pointerdown", onPointerDown);
	}, [showMixer]);

	if (!music?.available) return null;

	const devices = music.devices ?? [];
	const activeDevice = devices.find((d) => d.isDefault) ?? devices[0];

	const otherApps = (music.apps ?? []).filter((app) => {
		const appName = music.appName?.toLowerCase() || "";
		const currentStem = music.appId?.toLowerCase() || "";
		const targetName = app.name.toLowerCase();
		return !appName.includes(targetName) && !currentStem.includes(targetName);
	});

	return (
		<div className="relative flex items-center gap-1.5 select-none" data-no-drag>
			{music.appVolume && (
				<VolumeSlider
					name={music.appDevice ? `${music.appName} · ${music.appDevice}` : music.appName}
					volume={music.appVolume}
					icon={
						music.appIcon ? (
							<img src={music.appIcon} alt="" draggable={false} className="size-3.5" />
						) : (
							<MusicIcon size={12} />
						)
					}
					onChange={(change) => setVolume({ target: "app", appId: music.appId, ...change })}
				/>
			)}

			{music.volume && (
				<VolumeSlider
					name={activeDevice?.name || t("music.computer")}
					volume={music.volume}
					icon={getDeviceIcon(activeDevice?.kind ?? "speakers", 13)}
					onChange={(change) => setVolume({ target: "system", ...change })}
				/>
			)}

			{devices.length > 0 && (
				<div ref={routerRef} className="relative">
					<button
						type="button"
						className={cn(
							"flex h-7 max-w-28 sm:max-w-32 items-center gap-1.5 rounded-[12px] bg-card hover:bg-white/10 dark:hover:bg-white/15 border border-hairline px-2 shadow-xs text-text-dim transition-all duration-200 active:scale-95",
							showDeviceRouter && "bg-white/[0.18] text-text ring-1 ring-accent/40 border-hairline",
						)}
						title={activeDevice ? `${activeDevice.name} · ${t("music.switchOutput")}` : t("music.audioOutput")}
						onClick={() => {
							setShowDeviceRouter((v) => !v);
							setShowMixer(false);
						}}
					>
						<span className="shrink-0 text-accent">{getDeviceIcon(activeDevice?.kind ?? "speakers", 12)}</span>
						<span className="truncate text-[11px] font-medium tracking-tight">
							{activeDevice?.name || t("music.audioOutput")}
						</span>
					</button>

					{showDeviceRouter && (
						<div className="absolute right-0 bottom-full mb-2 flex max-h-56 w-60 flex-col gap-1 overflow-y-auto rounded-2xl bg-island p-2 shadow-2xl backdrop-blur-2xl border border-hairline z-50 text-text">
							<div className="flex items-center justify-between px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-faint">
								<span>{t("music.audioOutput")}</span>
								<span className="text-[9px] font-medium lowercase opacity-70">
									{devices.length} {devices.length === 1 ? "device" : "devices"}
								</span>
							</div>
							{devices.map((device) => {
								const isSelected = device.isDefault;
								return (
									<button
										key={device.id}
										type="button"
										className={cn(
											"flex items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[11.5px] transition-all duration-150 group",
											isSelected
												? "bg-accent/15 text-accent font-medium shadow-xs"
												: "text-text-dim hover:bg-card hover:text-text active:scale-[0.98]",
										)}
										onClick={() => {
											setAudioDevice(device.id);
											setShowDeviceRouter(false);
										}}
									>
										<span
											className={cn("shrink-0", isSelected ? "text-accent" : "text-text-muted group-hover:text-text")}
										>
											{getDeviceIcon(device.kind, 13)}
										</span>
										<span className="flex-1 truncate" title={device.name}>
											{device.name}
										</span>
										{isSelected && <CheckIcon size={12} className="shrink-0 text-accent" />}
									</button>
								);
							})}
						</div>
					)}
				</div>
			)}

			{otherApps.length > 0 && (
				<div ref={mixerRef} className="relative">
					<button
						type="button"
						className={cn(
							"grid size-7 place-items-center rounded-[12px] bg-card hover:bg-white/10 dark:hover:bg-white/15 border border-hairline shadow-xs text-text-dim transition-all duration-200 active:scale-92",
							showMixer && "bg-white/[0.18] text-text border-hairline",
						)}
						title={t("music.mixer") || "Audio mixer"}
						onClick={() => {
							setShowMixer((v) => !v);
							setShowDeviceRouter(false);
						}}
					>
						<SlidersHorizontalIcon size={12} />
					</button>

					{showMixer && (
						<div className="absolute right-0 bottom-full mb-2 flex max-h-48 w-56 flex-col gap-1.5 overflow-y-auto rounded-2xl bg-island p-2 shadow-2xl backdrop-blur-xl border border-hairline z-50 text-text">
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
		if (r.width <= 0) return;
		setLevel((e.clientX - r.left) / r.width);
	};

	const percent = Math.round(shown.level * 100);
	return (
		<div
			className="flex h-7 min-w-0 flex-[0_1_auto] items-center gap-1.5 rounded-[12px] bg-card hover:bg-white/10 dark:hover:bg-white/15 border border-hairline shadow-xs pr-2 pl-1.5 transition-colors duration-200"
			onClick={(e) => e.stopPropagation()}
		>
			<button
				type="button"
				className={cn(
					"grid size-4.5 place-items-center text-text-dim transition-[opacity,color,transform] duration-200 hover:text-text active:scale-88 [&_img]:size-3.5",
					shown.muted && "opacity-40",
				)}
				title={t(shown.muted ? "music.unmute" : "music.mute", { name })}
				onClick={() => change({ muted: !shown.muted })}
			>
				{icon}
			</button>

			<div
				className="group/track flex h-full w-14 min-w-6 flex-[0_1_auto] cursor-pointer touch-none items-center outline-none"
				role="slider"
				tabIndex={0}
				title={`${name} · ${percent}%`}
				aria-label={t("music.volume", { name })}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percent}
				onPointerDown={(e) => {
					e.currentTarget.setPointerCapture(e.pointerId);
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
				<div className="relative h-1 flex-1 overflow-hidden rounded-full bg-black/20 dark:bg-white/16 transition-[height] duration-200 ease-[ease] group-hover/track:h-1.5 group-focus-visible/track:h-1.5">
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
