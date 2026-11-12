import { MonitorIcon, MusicIcon, QuoteIcon } from "lucide-react";
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
import { MusicThemeProvider, useMusicTheme } from "../themes/theme.provider";
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
					: 0.22
				: glowSetting === "immersive"
					? theme.mode === "light"
						? 0.35
						: 0.75
					: theme.mode === "light"
						? 0.2
						: 0.45;

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
			className="relative flex h-full items-center gap-4.5"
			style={{ "--accent": provider.brandColor } as React.CSSProperties}
		>
			{/* Atmospheric ambient artwork lighting (subtle radial diffusion behind artwork) */}
			{mode === "immersive" && glowOpacity > 0 && (
				<div
					className="pointer-events-none absolute -left-4 top-1/2 -translate-y-1/2 size-36 -z-10 rounded-full blur-2xl transition-all duration-700 will-change-transform"
					style={{
						background: theme.ambientGlow,
						opacity: glowOpacity,
					}}
				/>
			)}

			{/* ================= REGION A: ALBUM ARTWORK (88x88px) ================= */}
			{video ? (
				<div className="group/video relative h-22 w-38 flex-none overflow-hidden rounded-[16px] bg-black shadow-lg">
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
					className="group/thumb relative block flex-none text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
					title={session.source.applicationName}
					onClick={openPlayer}
				>
					<Artwork
						src={session.metadata.artwork}
						size={84}
						radius={18}
						trackKey={session.metadata.title}
						glow={provider.brandColor}
						badge={
							!pinned ? (
								<span
									className="grid size-6.5 place-items-center rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.3)] transition-transform duration-200 group-hover/thumb:scale-110"
									style={{
										backgroundColor: theme.mode === "light" ? "#ffffff" : "#141417",
										color: provider.brandColor,
										border: `1px solid ${theme.border}`,
									}}
								>
									{session.appIcon ? (
										<img src={session.appIcon} alt="" draggable={false} className="size-3.5" />
									) : (
										provider.renderIcon({ size: 13 })
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

			{/* ================= REGIONS B & C: INFO & CONTROLS ================= */}
			<div className="flex min-w-0 flex-1 flex-col justify-between py-0.5 h-full max-h-[126px]">
				{/* Row 1: Track Details + Service Badge + Visualizer */}
				<div className="flex items-center justify-between gap-3 min-w-0">
					{/* Track Title and Artist */}
					<div className="min-w-0 flex-1 flex flex-col justify-center leading-tight">
						<button
							type="button"
							className="relative block w-full min-w-0 flex-none text-left transition-opacity duration-200 hover:opacity-85"
							title={session.source.applicationName}
							onClick={openPlayer}
						>
							<Marquee
								text={session.metadata.title}
								className="text-[15px]/[1.3] font-[700] tracking-[-0.012em] text-text transition-colors duration-300"
							/>
						</button>
						{showLyrics && currentLine ? (
							<Marquee
								key={currentLine}
								text={`♪ ${currentLine}`}
								className="text-[12px]/[1.25] font-semibold text-accent transition-colors duration-300 mt-0.5"
							/>
						) : subtitle ? (
							<Marquee
								text={subtitle}
								className="text-[12px]/[1.25] font-medium text-text-dim transition-colors duration-300 mt-0.5"
							/>
						) : null}
					</div>

					{/* Service Indicator Badge & Visualizer (side-by-side, never overlapping) */}
					<div className="flex flex-none items-center gap-2">
						{hasLyrics && (
							<button
								type="button"
								className={cn(
									"grid size-6 place-items-center rounded-full text-text-dim hover:text-text hover:bg-white/10 active:scale-95 transition-all",
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
								color={provider.brandColor}
								height={16}
								barWidth={3}
								className="flex-none"
							/>
						)}

						<div
							className="inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-0.75 text-[11px] font-semibold border shadow-xs transition-colors duration-300"
							style={{
								backgroundColor: provider.badgeBg,
								color: provider.badgeText,
								borderColor: provider.badgeBorder,
							}}
						>
							{provider.renderIcon({ size: 12 })}
							<span className="truncate max-w-24 sm:max-w-28 font-medium">{provider.displayName}</span>
						</div>
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
				<div className="flex items-center justify-between gap-3 w-full h-11">
					{/* Playback Controls (Previous, Play/Pause, Next share exact centerline) */}
					<div className="-ml-1 flex items-center h-full">
						<MusicControls
							playing={session.playback.status === "playing"}
							capabilities={session.capabilities}
							onOpenSource={openPlayer}
						/>
					</div>

					{/* Volume Control Group (isolated from window dragging) */}
					<div className="flex min-w-0 flex-1 justify-end gap-1.5 items-center h-full" data-no-drag>
						<VolumeSliders music={music} />
					</div>
				</div>
			</div>
		</div>
	);
}
