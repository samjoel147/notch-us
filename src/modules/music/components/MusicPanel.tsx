import { MusicIcon, QuoteIcon } from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";
import { Marquee } from "../../../components/Marquee";
import { cn } from "../../../core/cn";
import { useT } from "../../../core/i18n";
import { useSetting } from "../../../core/settings";
import { normalizeMediaSession } from "../core/MediaSessionNormalizer";
import { selectActiveSession } from "../core/SessionPriorityEngine";
import { useLyrics } from "../hooks/useLyrics";
import { type MusicState, musicAction, setVolume, useLivePosition } from "../hooks/useMusic";
import { closePip, openPip, usePipOpen } from "../hooks/usePip";
import { getProviderDefinition } from "../providers/registry";
import { musicSettings } from "../settings";
import { MusicThemeProvider, useMusicAtmosphere, useMusicTheme } from "../themes/theme.provider";
import { type ArtworkPalette, extractArtworkPalette } from "../visuals/ArtworkPaletteEngine";
import { FluidMeshCanvas } from "../visuals/FluidMeshCanvas";
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
		complementary: fallbackAccent,
		backgroundCompatible: `${fallbackAccent}18`,
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
			artworkSecondary={palette.secondary}
			artworkComplementary={palette.complementary}
			artworkBackgroundCompatible={palette.backgroundCompatible}
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
	const atmosphere = useMusicAtmosphere();
	const t = useT();
	const pinned = usePipOpen();
	const videoEnabled = useSetting(musicSettings.video);
	const glowSetting = useSetting(musicSettings.glowIntensity) || "vibrant";
	const mirror = useMirrorVideo(music?.youtubeId);
	const video = videoEnabled && !pinned ? mirror : null;
	const [showLyrics, setShowLyrics] = useState(false);
	const { currentLine, hasLyrics } = useLyrics(music, session?.playback.position ?? 0);

	const glowOpacity =
		glowSetting === "off"
			? 0
			: glowSetting === "subtle"
				? theme.mode === "light"
					? 0.1
					: 0.2
				: glowSetting === "immersive"
					? theme.mode === "light"
						? 0.3
						: 0.65
					: theme.mode === "light"
						? 0.18
						: 0.4;

	// Empty state when nothing is playing
	if (!music?.available || !session) {
		const activeApps = music?.apps ?? [];
		return (
			<div className="notch-music-player">
				<div className="notch-music-player__container flex-col justify-between py-1">
					<div className="flex items-center justify-between w-full">
						<div
							className="flex items-center gap-2.5 text-[13.5px] font-semibold transition-colors duration-200"
							style={{ color: theme.textMuted }}
						>
							<div className="grid size-7 place-items-center rounded-full bg-card text-text-dim">
								<MusicIcon size={16} />
							</div>
							<span>{t("music.nothingPlaying")}</span>
						</div>
						{music && (
							<div data-no-drag>
								<VolumeSliders music={music} />
							</div>
						)}
					</div>

					{activeApps.length > 0 ? (
						<div
							className="flex flex-col gap-1.5 border-t w-full pt-2 transition-colors duration-200"
							style={{ borderColor: "var(--hairline)" }}
							data-no-drag
						>
							<span className="text-[11px] font-medium tracking-tight" style={{ color: theme.textMuted }}>
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
						<div className="text-[11.5px] pb-1 w-full text-center" style={{ color: theme.textMuted }}>
							{t("music.noAudioApps") || "No applications currently playing sound"}
						</div>
					)}
				</div>
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
			className="notch-music-player"
			style={
				{
					"--accent": theme.accentPrimary,
					"--play-glow": `${theme.accentPrimary}60`,
					"--artwork-glow": theme.accentPrimary,
					"--player-text": theme.textPrimary,
					"--player-text-dim": theme.textSecondary,
					"--player-text-muted": theme.textMuted,
					"--player-border": theme.border,
					"--player-card": theme.controlSurface,
					"--player-specular": theme.rimSpecular,
				} as React.CSSProperties
			}
		>
			<div className="notch-music-player__container">
				{/* ================= 4-LAYER ATMOSPHERE ENGINE COMPOSITION ================= */}
				{/* LAYER 2: Living Fluid Mesh Canvas — Full-Surface Dual-Tone Dynamic Splash */}
				{glowOpacity > 0 && (
					<FluidMeshCanvas
						primaryColor={atmosphere.primaryColor}
						secondaryColor={atmosphere.secondaryColor}
						meshBackground="var(--music-fluid-mesh)"
						opacity={glowOpacity}
					/>
				)}

				{/* LAYER 2 Baseline: Pervasive Artwork Colour Wash across entire player surface */}
				<div
					className="notch-music-player__surface-wash pointer-events-none -z-20"
					style={{
						background: "var(--music-surface-wash)",
					}}
				/>

				{/* LAYER 3: Localized Artwork Bloom originating around artwork */}
				{mode === "immersive" && glowOpacity > 0 && (
					<div className="notch-music-player__atmosphere pointer-events-none -z-10">
						{/* Primary localized bloom focused around the thumbnail */}
						<div
							className="notch-music-player__atmosphere-glow"
							style={{
								background: "var(--music-ambient-glow)",
								opacity: glowOpacity,
							}}
						/>
						{/* Secondary atmospheric gradient spreading toward right controls */}
						<div
							className="notch-music-player__atmosphere-glow-secondary"
							style={{
								background: "var(--music-ambient-glow-secondary)",
								opacity: glowOpacity * 0.75,
							}}
						/>
					</div>
				)}

				{/* ================= REGION A: ALBUM ARTWORK (92x92px) ================= */}
				{video ? (
					<div className="group/video relative h-22 w-38 flex-none overflow-hidden rounded-[18px] bg-black shadow-lg">
						<YouTubeMirror
							videoId={video}
							positionMs={session.playback.position}
							playing={session.playback.status === "playing"}
							live={!session.playback.duration}
						/>
						<button
							type="button"
							className="absolute top-1.5 right-1.5 rounded-[9px] bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white opacity-0 transition-[opacity,background] duration-200 group-hover/video:opacity-100 hover:bg-[rgba(28,28,30,0.92)]"
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
						className="notch-music-player__artwork-container group/thumb text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
						title={session.source.applicationName}
						onClick={openPlayer}
					>
						<Artwork
							src={session.metadata.artwork}
							size={92}
							radius={16}
							trackKey={session.metadata.title}
							glow={theme.accentPrimary}
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

				{/* ================= REGIONS B & C: INFO & CONTROLS ================= */}
				<div className="notch-music-player__content">
					{/* Row 1: Track Details + Service Badge + Visualizer */}
					<div className="notch-music-player__header">
						{/* Track Title and Artist */}
						<div className="notch-music-player__metadata">
							<button
								type="button"
								className="relative block w-full min-w-0 text-left transition-opacity duration-200 hover:opacity-85"
								title={session.source.applicationName}
								onClick={openPlayer}
							>
								<Marquee
									text={session.metadata.title}
									className="text-[17px]/[1.3] font-[650] tracking-[-0.018em] text-text transition-colors duration-200"
								/>
							</button>
							{showLyrics && currentLine ? (
								<Marquee
									key={currentLine}
									text={`♪ ${currentLine}`}
									className="text-[12px]/[1.25] font-semibold text-accent transition-colors duration-200 mt-0.5"
								/>
							) : subtitle ? (
								<Marquee
									text={subtitle}
									className="text-[12.5px]/[1.25] font-medium text-text-dim transition-colors duration-200 mt-0.5"
								/>
							) : null}
						</div>

						{/* Service Indicator Badge & Visualizer (side-by-side, precision aligned) */}
						<div className="flex flex-none items-center gap-2">
							{hasLyrics && (
								<button
									type="button"
									className={cn(
										"grid size-6.5 place-items-center rounded-full text-text-dim hover:text-text hover:bg-card active:scale-95 transition-all",
										showLyrics && "text-accent bg-accent/15",
									)}
									title={showLyrics ? "Show track metadata" : "Peek synchronized lyrics"}
									onClick={() => setShowLyrics((v) => !v)}
								>
									<QuoteIcon size={12} />
								</button>
							)}

							{showVisualizer && (
								<MusicVisualizer
									playing={session.playback.status === "playing"}
									color={theme.accentPrimary}
									height={16}
									barWidth={2.5}
									className="flex-none"
								/>
							)}

							<button
								type="button"
								onClick={openPlayer}
								className="notch-music-player__badge border shadow-xs"
								style={{
									backgroundColor: provider.badgeBg,
									color: provider.badgeText,
									borderColor: provider.badgeBorder,
								}}
								title={session.source.applicationName || provider.displayName}
							>
								{session.appIcon ? (
									<img src={session.appIcon} alt="" draggable={false} className="size-3.5" />
								) : (
									provider.renderIcon({ size: 12 })
								)}
								<span className="truncate max-w-24 sm:max-w-28 font-medium">{provider.displayName}</span>
							</button>
						</div>
					</div>

					{/* Row 2: Progress Timeline with Centered Timestamps */}
					<div className="w-full">
						<MusicProgress
							position={session.playback.position}
							duration={session.playback.duration}
							canSeek={session.capabilities.canSeek}
							accentGradient={theme.progressFill}
						/>
					</div>

					{/* Row 3: Playback Controls on Left, Volume Controls on Right */}
					<div className="notch-music-player__footer">
						{/* Playback Controls (Previous, Play/Pause, Next share exact centerline) */}
						<div className="flex items-center h-full">
							<MusicControls
								playing={session.playback.status === "playing"}
								capabilities={session.capabilities}
								accentColor={theme.accentPrimary}
							/>
						</div>

						{/* Volume Control Group (isolated from window dragging) */}
						<div className="flex min-w-0 flex-1 justify-end gap-1.5 items-center h-full" data-no-drag>
							<VolumeSliders music={music} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
