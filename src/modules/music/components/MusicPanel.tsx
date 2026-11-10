import { MonitorIcon, MusicIcon } from "lucide-react";
import { motion } from "motion/react";
import type { CSSProperties, MouseEvent } from "react";
import { Marquee } from "../../../components/Marquee";
import { useT } from "../../../core/i18n";
import { useSetting } from "../../../core/settings";
import { formatTime, type MusicState, musicAction, setVolume, useLivePosition } from "../hooks/useMusic";
import { closePip, openPip, usePipOpen } from "../hooks/usePip";
import { musicSettings } from "../settings";
import { detectMusicSource } from "../sources";
import { Artwork } from "./Artwork";
import { Controls } from "./Controls";
import { Visualizer } from "./Visualizer";
import { VolumeSlider, VolumeSliders } from "./VolumeSliders";
import { useMirrorVideo, YouTubeMirror } from "./YouTubeMirror";

/** Expanded now-playing panel with streaming service and theme intelligence. */
export function MusicPanel({
	music,
	accent,
	showVisualizer = true,
}: {
	music: MusicState | undefined;
	accent: string;
	showVisualizer?: boolean;
}) {
	const position = useLivePosition(music);
	const t = useT();
	const pinned = usePipOpen();
	const videoEnabled = useSetting(musicSettings.video);
	const mirror = useMirrorVideo(music?.youtubeId);
	// While pinned, only the pinned window plays the video.
	const video = videoEnabled && !pinned ? mirror : null;
	const source = detectMusicSource(music);

	if (!music?.available) {
		const activeApps = music?.apps ?? [];
		return (
			<div className="flex h-full flex-col justify-between py-1">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2.5 text-[14px] font-semibold text-text-faint">
						<MusicIcon size={22} />
						<span>{t("music.nothingPlaying")}</span>
					</div>
					{music?.volume && (
						<div data-no-drag>
							<VolumeSlider
								name={t("music.computer")}
								volume={music.volume}
								icon={<MonitorIcon size={13} />}
								onChange={(change) => setVolume({ target: "system", ...change })}
							/>
						</div>
					)}
				</div>

				{activeApps.length > 0 ? (
					<div className="flex flex-col gap-1.5 border-t border-white/8 pt-2" data-no-drag>
						<span className="text-[11px] font-semibold text-text-faint">{t("music.mixer") || "Audio mixer"}</span>
						<div className="flex max-h-16 flex-wrap items-center gap-2 overflow-y-auto">
							{activeApps.map((app) => (
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
					</div>
				) : (
					<div className="text-[12px] text-text-faint">
						{t("music.noAudioApps") || "No applications currently playing sound"}
					</div>
				)}
			</div>
		);
	}

	const progress = music.durationMs ? position / music.durationMs : 0;
	const subtitle = [music.artist, music.album].filter(Boolean).join(" — ") || music.appName;
	const openPlayer = (e: MouseEvent) => {
		e.stopPropagation();
		musicAction("focus");
	};

	return (
		<div
			className="relative flex h-full items-center gap-4.5"
			style={
				{
					"--accent": accent,
					"--source-color": source.brandColor,
				} as CSSProperties
			}
		>
			{/* Ambient atmospheric backdrop glow */}
			<div
				className="pointer-events-none absolute -inset-4 -z-10 rounded-[28px] opacity-35 blur-2xl transition-all duration-700"
				style={{
					background: `radial-gradient(ellipse at 15% 45%, ${source.glowColor} 0%, ${accent}30 50%, transparent 80%)`,
				}}
			/>

			{video ? (
				// YouTube in a browser: the video itself plays here (muted, in sync with the tab).
				<div className="group/video relative h-28 w-50 flex-none overflow-hidden rounded-2xl bg-black shadow-lg">
					<YouTubeMirror videoId={video} positionMs={position} playing={music.playing} live={!music.durationMs} />
					<button
						type="button"
						className="absolute top-1.5 right-1.5 rounded-[11px] bg-black/65 px-2.25 py-0.75 text-[11.5px] font-semibold text-white opacity-0 transition-[opacity,background] duration-200 group-hover/video:opacity-100 hover:bg-[rgba(28,28,30,0.92)]"
						onClick={(e) => {
							e.stopPropagation();
							openPip();
						}}
					>
						{t("music.pin")}
					</button>
				</div>
			) : (
				<button
					type="button"
					className="group/thumb relative block flex-none text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
					title={music.appName}
					onClick={openPlayer}
				>
					<Artwork src={music.thumbnail} size={112} radius={20} trackKey={music.title} glow={source.brandColor} />

					{/* Streaming service brand badge pinned on bottom-right of artwork */}
					{!pinned && (
						<span
							className="pointer-events-none absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-[10px] bg-[#141417]/95 shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.2)] transition-transform duration-200 group-hover/thumb:scale-110"
							style={{ color: source.brandColor }}
						>
							{music.appIcon ? (
								<img src={music.appIcon} alt="" draggable={false} className="size-4" />
							) : (
								source.renderIcon({ size: 14 })
							)}
						</span>
					)}

					{pinned && (
						<span
							className="absolute inset-x-1.5 bottom-1.5 cursor-pointer rounded-[11px] bg-black/70 px-2.25 py-0.75 text-center text-[10.5px] font-semibold text-white shadow-md backdrop-blur-md transition-[opacity,background] duration-200 hover:bg-[rgba(28,28,30,0.92)]"
							title={t("music.unpin")}
							onClick={(e) => {
								e.stopPropagation();
								closePip();
							}}
						>
							{t("music.pinned")}
						</span>
					)}
				</button>
			)}

			<div className="flex h-28 min-w-0 flex-1 flex-col justify-between py-0.5">
				{/* Top Header: Streaming Brand Pill & Visualizer */}
				<div className="flex items-center justify-between gap-2">
					<div
						className="inline-flex max-w-[280px] items-center gap-1.5 rounded-full px-2.25 py-0.5 text-[11px] font-semibold shadow-xs transition-colors duration-300"
						style={{
							backgroundColor: source.badgeBg,
							color: source.badgeText,
							border: `1px solid ${source.badgeBorder}`,
						}}
					>
						{source.renderIcon({ size: 12 })}
						<span className="truncate">
							{source.name}
							{music.appDevice ? ` · ${music.appDevice}` : ""}
						</span>
					</div>

					{showVisualizer && (
						<Visualizer
							playing={music.playing}
							color={source.brandColor}
							height={24}
							barWidth={4}
							className="flex-none"
						/>
					)}
				</div>

				{/* Track Title and Artist */}
				<div className="min-w-0">
					<button
						type="button"
						className="relative block w-full min-w-0 flex-none text-left transition-[opacity,color,transform] duration-200 hover:opacity-85 active:scale-[0.99]"
						title={music.appName}
						onClick={openPlayer}
					>
						<Marquee text={music.title} className="text-[16.5px]/[1.25] font-[650] tracking-[-0.015em] text-text" />
					</button>
					<Marquee text={subtitle} className="text-[13px]/[1.3] text-text-dim font-medium" />
				</div>

				{/* Modern Scrubber Bar with Glow Thumb */}
				<div className="group/scrub flex items-center gap-2.5">
					<span className="min-w-9.5 text-[11px] font-medium text-text-faint tabular-nums">{formatTime(position)}</span>
					<div
						className="relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/12 transition-[height] duration-200 ease-[ease] group-hover/scrub:h-2"
						onClick={(e) => {
							if (!music.durationMs) return;
							const r = e.currentTarget.getBoundingClientRect();
							musicAction("seek", Math.round(((e.clientX - r.left) / r.width) * music.durationMs));
						}}
					>
						<motion.div
							className="absolute inset-y-0 left-0 origin-left rounded-full"
							style={{
								background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 70%, #fff), ${source.brandColor})`,
							}}
							initial={false}
							animate={{ scaleX: Math.min(1, progress) }}
							transition={{ type: "tween", ease: "linear", duration: 0.25 }}
						/>
					</div>
					<span className="min-w-9.5 text-right text-[11px] font-medium text-text-faint tabular-nums">
						{music.durationMs ? `-${formatTime(music.durationMs - position)}` : "--:--"}
					</span>
				</div>

				{/* Bottom Action Deck: Controls & Audio Sliders */}
				<div className="-ml-1 flex items-center justify-between gap-3">
					<Controls music={music} accent={source.brandColor} />
					{/* Dragging a slider must not drag the island */}
					<div className="flex min-w-0 flex-1 justify-end gap-1.5" data-no-drag>
						<VolumeSliders music={music} />
					</div>
				</div>
			</div>
		</div>
	);
}
