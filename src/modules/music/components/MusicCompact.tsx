import { MusicIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Marquee } from "../../../components/Marquee";
import { normalizeMediaSession } from "../core/MediaSessionNormalizer";
import { formatTime, type MusicState, musicAction, useLivePosition } from "../hooks/useMusic";
import { getProviderDefinition } from "../providers/registry";
import { MusicThemeProvider, useMusicTheme } from "../themes/theme.provider";
import { type ArtworkPalette, extractArtworkPalette } from "../visuals/ArtworkPaletteEngine";
import { Artwork } from "./Artwork";
import { MusicVisualizer } from "./MusicVisualizer";

/** Left slot of the compact Notch Pop capsule: artwork + provider badge + title over artist. */
export function MusicCompactLeft({ music }: { music: MusicState }) {
	const position = useLivePosition(music);
	const session = normalizeMediaSession(music, position);
	const provider = getProviderDefinition(session?.source.providerId ?? "generic");

	const [palette, setPalette] = useState<ArtworkPalette | null>(null);

	useEffect(() => {
		let cancelled = false;
		extractArtworkPalette(session?.metadata.artwork ?? music.thumbnail, provider.brandColor).then((p) => {
			if (!cancelled) setPalette(p);
		});
		return () => {
			cancelled = true;
		};
	}, [session?.metadata.artwork, music.thumbnail, provider.brandColor]);

	return (
		<MusicThemeProvider
			providerBrandColor={provider.brandColor}
			providerGlowColor={provider.glowColor}
			artworkVibrant={palette?.vibrant}
			artworkMuted={palette?.muted}
			artworkSecondary={palette?.secondary}
			artworkComplementary={palette?.complementary}
			artworkBackgroundCompatible={palette?.backgroundCompatible}
			isPlaying={music.playing}
		>
			<CompactLeftContent music={music} session={session} provider={provider} />
		</MusicThemeProvider>
	);
}

function CompactLeftContent({
	music,
	session,
	provider,
}: {
	music: MusicState;
	session: ReturnType<typeof normalizeMediaSession>;
	provider: ReturnType<typeof getProviderDefinition>;
}) {
	const theme = useMusicTheme();

	return (
		<div className="relative flex items-center gap-2.5 min-w-0 transition-colors duration-200">
			{/* Mini Fluid Splash Echo */}
			<div
				className="pointer-events-none absolute -inset-1.5 -z-10 rounded-full opacity-35 transition-all duration-700"
				style={{
					background: "var(--music-fluid-mesh, var(--music-surface-wash))",
					filter: "blur(6px)",
				}}
				aria-hidden="true"
			/>
			<div className="relative flex-none">
				<Artwork
					src={session?.metadata.artwork ?? music.thumbnail}
					size={28}
					radius={9}
					trackKey={session?.metadata.title ?? music.title}
					glow={provider.brandColor}
				/>
				<span
					className="pointer-events-none absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border shadow-xs"
					style={{
						backgroundColor: provider.brandColor,
						borderColor: theme.mode === "light" ? "#ffffff" : "#000000",
					}}
					title={provider.displayName}
				/>
			</div>

			<AnimatePresence mode="popLayout" initial={false}>
				<motion.div
					key={`${music.title}|${music.artist}`}
					className="flex max-w-48 min-w-0 flex-col leading-tight"
					initial={{ opacity: 0, y: 5, filter: "blur(3px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					exit={{ opacity: 0, y: -5, filter: "blur(3px)" }}
					transition={{ duration: 0.2 }}
				>
					<Marquee
						text={session?.metadata.title ?? music.title}
						className="text-[13px] font-semibold tracking-tight text-text transition-colors duration-200"
					/>
					{(session?.metadata.artist || music.artist) && (
						<Marquee
							text={session?.metadata.artist ?? music.artist}
							className="text-[11px] font-medium text-text-dim transition-colors duration-200"
						/>
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}

/** Right slot: live playback position + provider-tinted visualizer. */
export function MusicCompactRight({
	music,
	accent,
	showVisualizer,
}: {
	music: MusicState;
	accent: string;
	showVisualizer: boolean;
}) {
	const position = useLivePosition(music);
	const session = normalizeMediaSession(music, position);
	const provider = getProviderDefinition(session?.source.providerId ?? "generic");

	return (
		<MusicThemeProvider
			providerBrandColor={provider.brandColor}
			providerGlowColor={provider.glowColor}
			isPlaying={music.playing}
		>
			<CompactRightContent
				music={music}
				position={position}
				provider={provider}
				accent={accent}
				showVisualizer={showVisualizer}
			/>
		</MusicThemeProvider>
	);
}

function CompactRightContent({
	music,
	position,
	provider,
	accent,
	showVisualizer,
}: {
	music: MusicState;
	position: number;
	provider: ReturnType<typeof getProviderDefinition>;
	accent: string;
	showVisualizer: boolean;
}) {
	const visualizerColor = provider.id !== "generic" ? provider.brandColor : accent;

	return (
		<div className="flex items-center gap-2.5 flex-none transition-colors duration-200">
			<span className="text-[11.5px] font-medium tabular-nums font-mono text-text-dim transition-colors duration-200">
				{formatTime(position)}
			</span>
			{showVisualizer && (
				<button
					type="button"
					data-no-drag
					className="flex items-center justify-center cursor-pointer rounded-md p-1 -m-1 transition-transform active:scale-90 hover:bg-white/10"
					title={music.playing ? "Pause" : "Play"}
					onClick={(e) => {
						e.stopPropagation();
						musicAction("toggle");
					}}
				>
					<MusicVisualizer playing={music.playing} color={visualizerColor} height={18} barWidth={3} />
				</button>
			)}
		</div>
	);
}

/** Idle State Mini Player: Sleek Obsidian notch pill when no music is actively playing */
export function MusicIdleLeft() {
	return (
		<div className="flex items-center gap-2 text-text-dim text-[12.5px] font-medium">
			<div className="size-6 rounded-full bg-white/[0.08] grid place-items-center text-text-dim shadow-xs">
				<MusicIcon size={12.5} />
			</div>
			<span>Music</span>
		</div>
	);
}

export function MusicIdleRight() {
	return (
		<div className="flex items-center gap-1.5 text-text-faint text-[11px] font-mono">
			<span className="size-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
			<span>Ready</span>
		</div>
	);
}
