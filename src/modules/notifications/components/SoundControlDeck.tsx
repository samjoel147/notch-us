import {
	BellIcon,
	BellOffIcon,
	BluetoothIcon,
	CheckIcon,
	ChevronDownIcon,
	HeadphonesIcon,
	MonitorIcon,
	SpeakerIcon,
	Volume2Icon,
	VolumeXIcon,
} from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { cn } from "../../../core/cn";
import { setSetting, useSetting } from "../../../core/settings";
import {
	type AudioDevice,
	type AudioDeviceKind,
	setAudioDevice,
	setVolume,
	useMusic,
} from "../../music/hooks/useMusic";
import { notificationSettings } from "../settings";

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

export function SoundControlDeck() {
	const { music } = useMusic();
	const dnd = useSetting(notificationSettings.doNotDisturb);

	const [showDeviceMenu, setShowDeviceMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const systemVolume = music?.volume;
	const devices = music?.devices ?? [];
	const activeDevice = devices.find((d: AudioDevice) => d.isDefault) ?? devices[0];

	// Close device dropdown on outside pointer down
	useEffect(() => {
		if (!showDeviceMenu) return;
		const onPointerDown = (e: PointerEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setShowDeviceMenu(false);
			}
		};
		window.addEventListener("pointerdown", onPointerDown);
		return () => window.removeEventListener("pointerdown", onPointerDown);
	}, [showDeviceMenu]);

	const currentLevel = systemVolume ? (systemVolume.muted ? 0 : systemVolume.level) : 1;
	const isMuted = systemVolume?.muted ?? false;

	const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
		const val = Number.parseFloat(e.target.value);
		setVolume({ target: "system", level: val, muted: val === 0 });
	};

	const handleToggleMute = () => {
		if (!systemVolume) return;
		setVolume({ target: "system", muted: !isMuted });
	};

	const handleSelectDevice = (device: AudioDevice) => {
		setAudioDevice(device.id);
		setShowDeviceMenu(false);
	};

	const handleToggleDnd = () => {
		setSetting(notificationSettings.doNotDisturb, !dnd);
	};

	return (
		<div className="relative mb-2.5 flex flex-col gap-2 rounded-2xl border border-hairline bg-card/65 p-2.5 shadow-xs backdrop-blur-md">
			<div className="flex items-center justify-between gap-2">
				{/* Audio Output Endpoint Selector */}
				<div className="relative flex-1 min-w-0" ref={menuRef}>
					<button
						type="button"
						className={cn(
							"flex h-7.5 w-full items-center justify-between gap-1.5 rounded-xl border border-hairline bg-card/80 px-2.5 text-[11.5px] font-medium text-text transition-all duration-150 hover:bg-card hover:border-hairline-strong active:scale-[0.99] cursor-pointer",
							showDeviceMenu && "border-accent/60 ring-2 ring-accent/20",
						)}
						onClick={() => setShowDeviceMenu((v) => !v)}
						title="Audio Output Device"
					>
						<div className="flex items-center gap-1.5 truncate">
							<span className="text-text-dim flex-none">
								{activeDevice ? getDeviceIcon(activeDevice.kind, 14) : <SpeakerIcon size={14} />}
							</span>
							<span className="truncate text-text font-semibold">
								{activeDevice ? activeDevice.name : "Sound Output"}
							</span>
						</div>
						<ChevronDownIcon
							size={12}
							className={cn(
								"text-text-dim transition-transform duration-200 flex-none",
								showDeviceMenu && "rotate-180",
							)}
						/>
					</button>

					{/* Device Dropdown Menu */}
					{showDeviceMenu && (
						<div
							className="absolute top-9 left-0 z-50 w-72 max-w-[calc(100vw-32px)] rounded-2xl border border-hairline bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-dim">
								Audio Output Sinks
							</div>
							<div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto [scrollbar-width:none]">
								{devices.length === 0 ? (
									<div className="px-2.5 py-2 text-[11px] text-text-dim">No devices detected</div>
								) : (
									devices.map((device: AudioDevice) => {
										const selected = device.isDefault;
										return (
											<button
												key={device.id}
												type="button"
												className={cn(
													"flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-[11.5px] transition-colors cursor-pointer",
													selected ? "bg-accent/15 text-accent font-semibold" : "text-text hover:bg-white/10",
												)}
												onClick={() => handleSelectDevice(device)}
											>
												<div className="flex items-center gap-2 truncate">
													<span className={cn(selected ? "text-accent" : "text-text-dim")}>
														{getDeviceIcon(device.kind, 14)}
													</span>
													<span className="truncate">{device.name}</span>
												</div>
												{selected && <CheckIcon size={13} className="text-accent flex-none" />}
											</button>
										);
									})
								)}
							</div>
						</div>
					)}
				</div>

				{/* Do Not Disturb Toggle */}
				<button
					type="button"
					className={cn(
						"flex h-7.5 items-center gap-1.5 rounded-xl border px-2.5 text-[11.5px] font-semibold transition-all duration-150 cursor-pointer flex-none",
						dnd
							? "border-warn/40 bg-warn/15 text-warn shadow-xs"
							: "border-hairline bg-card/80 text-text-dim hover:bg-card hover:text-text",
					)}
					onClick={handleToggleDnd}
					title={dnd ? "Do Not Disturb is On" : "Turn on Do Not Disturb"}
				>
					{dnd ? <BellOffIcon size={13} /> : <BellIcon size={13} />}
					<span>{dnd ? "DND On" : "DND"}</span>
				</button>
			</div>

			{/* Master Volume Slider Row */}
			<div className="flex items-center gap-2.5 px-0.5">
				<button
					type="button"
					className="flex size-7 items-center justify-center rounded-lg text-text-dim hover:text-text hover:bg-white/10 transition-colors cursor-pointer flex-none"
					onClick={handleToggleMute}
					title={isMuted ? "Unmute system" : "Mute system"}
				>
					{isMuted || currentLevel === 0 ? (
						<VolumeXIcon size={15} className="text-danger" />
					) : (
						<Volume2Icon size={15} className="text-text" />
					)}
				</button>

				<div className="relative flex-1 flex items-center">
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={currentLevel}
						onChange={handleSliderChange}
						className="h-2 w-full appearance-none rounded-full bg-white/15 accent-[var(--tab-accent,#38bdf8)] transition-all cursor-pointer focus:outline-hidden"
						aria-label="Master volume"
					/>
				</div>

				<span className="w-8 text-right font-mono text-[11px] font-semibold tabular-nums text-text-dim flex-none">
					{Math.round(currentLevel * 100)}%
				</span>
			</div>
		</div>
	);
}
