import { MonitorIcon, MusicIcon } from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";
import { Marquee } from "../../../components/Marquee";
import { useT } from "../../../core/i18n";
import { useSetting } from "../../../core/settings";
import { useActiveTheme } from "../../../core/theme";
import { normalizeMediaSession } from "../core/MediaSessionNormalizer";
import { selectActiveSession } from "../core/SessionPriorityEngine";
import { type MusicState, musicAction, setVolume, useLivePosition } from "../hooks/useMusic";
import { closePip, openPip, usePipOpen } from "../hooks/usePip";
import { getProviderDefinition } from "../providers/registry";
import { musicSettings } from "../settings";
import { type ArtworkPalette, extractArtworkPalette } from "../visuals/ArtworkPaletteEngine";
import { composeAtmosphere } from "../visuals/AtmosphereComposer";
import { Artwork } from "./Artwork";
import { MusicControls } from "./MusicControls";
import { MusicProgress } from "./MusicProgress";
import { MusicVisualizer } from "./MusicVisualizer";
import { VolumeSlider, VolumeSliders } from "./VolumeSliders";
import { useMirrorVideo, YouTubeMirror } from "./YouTubeMirror";

export type MusicExperienceMode = "minimal" | "immersive" | "compact";

interface MusicPanelProps {
	music: MusicState | undefined;
	accent: string;
	showVisualizer?: boolean;
	mode?: MusicExperienceMode;
}

export function MusicPanel({
	music,
	accent: fallbackAccent,
	showVisualizer = true,
	mode = "immersive",
}: MusicPanelProps) {
	const position = useLivePosition(music);
	const t = useT();
	const pinned = usePipOpen();
	const videoEnabled = useSetting(musicSettings.video);
	const mirror = useMirrorVideo(music?.youtubeId);
	const video = videoEnabled && !pinned ? mirror : null;
	const theme = useActiveTheme();

	// Normalize session state and resolve provider identity
	const normalized = normalizeMediaSession(music, position);
	const session = selectActiveSession(normalized, pinned);

	const provider = getProviderDefinition(session?.source.providerId ?? "generic");

	// Asynchronously extract and harmonize artwork palette
	const [palette, setPalette] = useState<ArtworkPalette>({
		dominant: fallbackAccent,
		vibrant: fallbackAccent,
		muted: fallbackAccent,
		secondary: fallbackAccent,
		glow: `${fallbackAccent}55`,
		luminance: 0.5,
		saturation: 0.5,
		isDark: false,
		isLight: false,
		isMonochrome: false,
	});

	useEffect(() => {
		let cancelled = false;
		extractArtworkPalette(session?.metadata.artwork, provider.brandColor).then((p) => {
			if (!cancelled) setPalette(p);
		});
		return () => {
			cancelled = true;
		};
	}, [session?.metadata.artwork, provider.brandColor]);

	const atmosphere = composeAtmosphere(theme, palette, provider);

	if (!music?.available || !session) {
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

	const openPlayer = (e?: MouseEvent) => {
		e?.stopPropagation();
		musicAction("focus");
	};

	const subtitle =
		[session.metadata.artist, session.metadata.album].filter(Boolean).join(" — ") ||
		session.source.applicationName ||
		"";

	return (
		<div
			className="relative flex h-full items-center gap-4.5"
			style={
				{
					"--accent": palette.vibrant,
					"--source-color": provider.brandColor,
				} as React.CSSProperties
			}
		>
			{/* Ambient atmospheric backdrop glow (Mode: Immersive) */}
			{mode === "immersive" && (
				<div
					className="pointer-events-none absolute -inset-5 -z-10 rounded-[28px] blur-2xl transition-all duration-700"
					style={atmosphere.backdropStyle}
				/>
			)}

			{/* Left Column: Artwork / Video Mirror */}
			{video ? (
				<div className="group/video relative h-28 w-50 flex-none overflow-hidden rounded-2xl bg-black shadow-lg">
					<YouTubeMirror
						videoId={video}
						positionMs={session.playback.position}
						playing={session.playback.status === "playing"}
						live={!session.playback.duration}
					/>
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
					title={session.source.applicationName}
					onClick={openPlayer}
				>
					<Artwork
						src={session.metadata.artwork}
						size={112}
						radius={20}
						trackKey={session.metadata.title}
						glow={provider.brandColor}
					/>

					{/* Provider Emblem Badge pinned on bottom-right */}
					{!pinned && (
						<span
							className="pointer-events-none absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-[10px] bg-[#141417]/95 shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.2)] transition-transform duration-200 group-hover/thumb:scale-110"
							style={{ color: provider.brandColor }}
						>
							{session.appIcon ? (
								<img src={session.appIcon} alt="" draggable={false} className="size-4" />
							) : (
								provider.renderIcon({ size: 14 })
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

			{/* Right Column: Header, Metadata, Scrubber, Controls */}
			<div className="flex h-28 min-w-0 flex-1 flex-col justify-between py-0.5">
				{/* Top Section: Provider Badge & Visualizer */}
				<div className="flex items-center justify-between gap-2">
					<div
						className="inline-flex max-w-[280px] items-center gap-1.5 rounded-full px-2.25 py-0.5 text-[11px] font-semibold shadow-xs transition-colors duration-300"
						style={atmosphere.badgeStyle}
					>
						{provider.renderIcon({ size: 12 })}
						<span className="truncate">
							{provider.displayName}
							{session.device?.name ? ` · ${session.device.name}` : ""}
						</span>
					</div>

					{showVisualizer && (
						<MusicVisualizer
							playing={session.playback.status === "playing"}
							color={provider.brandColor}
							height={22}
							barWidth={4}
							className="flex-none"
						/>
					)}
				</div>

				{/* Center: Track Title & Subtitle with Marquee */}
				<div className="min-w-0">
					<button
						type="button"
						className="relative block w-full min-w-0 flex-none text-left transition-[opacity,color,transform] duration-200 hover:opacity-85 active:scale-[0.99]"
						title={session.source.applicationName}
						onClick={openPlayer}
					>
						<Marquee
							text={session.metadata.title}
							className="text-[16.5px]/[1.25] font-[650] tracking-[-0.015em] text-text"
						/>
					</button>
					{subtitle && <Marquee text={subtitle} className="text-[13px]/[1.3] text-text-dim font-medium" />}
				</div>

				{/* Progress Scrubber */}
				<MusicProgress
					position={session.playback.position}
					duration={session.playback.duration}
					canSeek={session.capabilities.canSeek}
					accentGradient={atmosphere.accentGradient}
				/>

				{/* Bottom Action Deck */}
				<div className="-ml-1 flex items-center justify-between gap-3">
					<MusicControls
						playing={session.playback.status === "playing"}
						capabilities={session.capabilities}
						accent={provider.brandColor}
						onOpenSource={openPlayer}
					/>

					{/* Sliders (drag-isolated) */}
					<div className="flex min-w-0 flex-1 justify-end gap-1.5" data-no-drag>
						<VolumeSliders music={music} />
					</div>
				</div>
			</div>
		</div>
	);
}
