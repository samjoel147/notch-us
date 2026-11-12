import { MonitorIcon, MusicIcon } from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";
import { Marquee } from "../../../components/Marquee";
import { cn } from "../../../core/cn";
import { useT } from "../../../core/i18n";
import { useSetting } from "../../../core/settings";
import { normalizeMediaSession } from "../core/MediaSessionNormalizer";
import { selectActiveSession } from "../core/SessionPriorityEngine";
import { type MusicState, musicAction, setVolume, useLivePosition } from "../hooks/useMusic";
import { closePip, openPip, usePipOpen } from "../hooks/usePip";
import { getProviderDefinition } from "../providers/registry";
import { musicSettings } from "../settings";
import { MusicThemeProvider, useMusicMaterial, useMusicTheme } from "../themes/theme.provider";
import { type ArtworkPalette, extractArtworkPalette } from "../visuals/ArtworkPaletteEngine";
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
	const pinned = usePipOpen();
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

	return (
		<MusicThemeProvider
			providerBrandColor={provider.brandColor}
			providerGlowColor={provider.glowColor}
			artworkVibrant={palette.vibrant}
			artworkMuted={palette.muted}
			isPlaying={session?.playback.status === "playing"}
		>
			<MusicPanelContent
				music={music}
				session={session}
				provider={provider}
				showVisualizer={showVisualizer}
				mode={mode}
			/>
		</MusicThemeProvider>
	);
}

function MusicPanelContent({
	music,
	session,
	provider,
	showVisualizer,
	mode,
}: {
	music: MusicState | undefined;
	session: ReturnType<typeof selectActiveSession>;
	provider: ReturnType<typeof getProviderDefinition>;
	showVisualizer: boolean;
	mode: MusicExperienceMode;
}) {
	const theme = useMusicTheme();
	const material = useMusicMaterial();
	const t = useT();
	const pinned = usePipOpen();
	const videoEnabled = useSetting(musicSettings.video);
	const mirror = useMirrorVideo(music?.youtubeId);
	const video = videoEnabled && !pinned ? mirror : null;

	if (!music?.available || !session) {
		const activeApps = music?.apps ?? [];
		return (
			<div className="flex h-full flex-col justify-between py-1 transition-colors duration-300">
				<div className="flex items-center justify-between">
					<div
						className="flex items-center gap-2.5 text-[14px] font-semibold transition-colors duration-300"
						style={{ color: theme.textMuted }}
					>
						<MusicIcon size={20} />
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
					<div
						className="flex flex-col gap-1.5 border-t pt-2 transition-colors duration-300"
						style={{ borderColor: theme.border }}
						data-no-drag
					>
						<span
							className="text-[11px] font-semibold transition-colors duration-300"
							style={{ color: theme.textMuted }}
						>
							{t("music.mixer") || "Audio mixer"}
						</span>
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
					<div className="text-[12px] transition-colors duration-300" style={{ color: theme.textMuted }}>
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
		[session.metadata.artist, session.metadata.album].filter(Boolean).join(" • ") ||
		session.source.applicationName ||
		"";

	return (
		<div
			className={cn(
				"relative flex h-full items-center gap-4 transition-all duration-300 rounded-[28px]",
				material.className,
			)}
			style={material.style}
		>
			{/* Ambient atmospheric backdrop glow */}
			{mode === "immersive" && (
				<div
					className="pointer-events-none absolute -inset-6 -z-10 rounded-[32px] blur-2xl transition-all duration-700"
					style={{
						background: theme.ambientGlow,
						opacity: theme.mode === "light" ? 0.16 : 0.42,
					}}
				/>
			)}

			{/* Left Column: 76px Album Artwork with Provider Emblem */}
			{video ? (
				<div className="group/video relative h-24 w-42 flex-none overflow-hidden rounded-2xl bg-black shadow-lg">
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
						size={76}
						radius={16}
						trackKey={session.metadata.title}
						glow={provider.brandColor}
						badge={
							!pinned ? (
								<span
									className="grid size-6 place-items-center rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.3)] transition-transform duration-200 group-hover/thumb:scale-110"
									style={{
										backgroundColor: theme.mode === "light" ? "#ffffff" : "#141417",
										color: provider.brandColor,
										border: `1px solid ${theme.border}`,
									}}
								>
									{session.appIcon ? (
										<img src={session.appIcon} alt="" draggable={false} className="size-3.5" />
									) : (
										provider.renderIcon({ size: 12 })
									)}
								</span>
							) : null
						}
					/>

					{pinned && (
						<span
							className="absolute inset-x-1 bottom-1 cursor-pointer rounded-[9px] bg-black/75 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white shadow-md backdrop-blur-md transition-all duration-200 hover:bg-black/90"
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

			{/* Right Column: Title, Artist, Source Pill, Progress, Controls, Volume */}
			<div className="flex h-full min-w-0 flex-1 flex-col justify-between py-0.5">
				{/* Top Row: Track Title & Streaming Source Badge */}
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0 flex-1">
						<button
							type="button"
							className="relative block w-full min-w-0 flex-none text-left transition-opacity duration-200 hover:opacity-85"
							title={session.source.applicationName}
							onClick={openPlayer}
						>
							<Marquee
								text={session.metadata.title}
								className="text-[15.5px]/[1.2] font-[700] tracking-[-0.015em] transition-colors duration-300"
								style={{ color: theme.textPrimary }}
							/>
						</button>
						{subtitle && (
							<Marquee
								text={subtitle}
								className="text-[12px]/[1.25] font-medium transition-colors duration-300 mt-0.5"
								style={{ color: theme.textSecondary }}
							/>
						)}
					</div>

					{/* Streaming Source Badge Pill */}
					<div
						className="inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-0.75 text-[11px] font-semibold shadow-xs ring-1 ring-white/10 transition-colors duration-300"
						style={{
							backgroundColor: provider.badgeBg,
							color: provider.badgeText,
							border: `1px solid ${provider.badgeBorder}`,
						}}
					>
						{provider.renderIcon({ size: 12 })}
						<span className="truncate max-w-28 font-medium">{provider.displayName}</span>
					</div>
				</div>

				{/* Middle Row: Interactive Progress Scrubber */}
				<MusicProgress
					position={session.playback.position}
					duration={session.playback.duration}
					canSeek={session.capabilities.canSeek}
					accentGradient={theme.progressFill}
				/>

				{/* Bottom Row: Transport Controls + Volume Slider + Visualizer */}
				<div className="-ml-1 flex items-center justify-between gap-3 pt-0.5">
					<MusicControls
						playing={session.playback.status === "playing"}
						capabilities={session.capabilities}
						onOpenSource={openPlayer}
					/>

					{/* Visualizer (if enabled) */}
					{showVisualizer && (
						<div className="hidden sm:flex items-center px-1">
							<MusicVisualizer
								playing={session.playback.status === "playing"}
								color={provider.brandColor}
								height={18}
								barWidth={3}
							/>
						</div>
					)}

					{/* Volume Slider (drag-isolated) */}
					<div className="flex min-w-0 flex-1 justify-end gap-1.5" data-no-drag>
						<VolumeSliders music={music} />
					</div>
				</div>
			</div>
		</div>
	);
}
