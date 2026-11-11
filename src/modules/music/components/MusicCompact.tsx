import { AnimatePresence, motion } from "motion/react";
import { Marquee } from "../../../components/Marquee";
import { normalizeMediaSession } from "../core/MediaSessionNormalizer";
import { formatTime, type MusicState, useLivePosition } from "../hooks/useMusic";
import { getProviderDefinition } from "../providers/registry";
import { MusicThemeProvider, useMusicTheme } from "../themes/theme.provider";
import { Artwork } from "./Artwork";
import { MusicVisualizer } from "./MusicVisualizer";

/** Left slot of the compact pill: artwork + provider badge dot + title over artist. */
export function MusicCompactLeft({ music }: { music: MusicState }) {
	const position = useLivePosition(music);
	const session = normalizeMediaSession(music, position);
	const provider = getProviderDefinition(session?.source.providerId ?? "generic");

	return (
		<MusicThemeProvider
			providerBrandColor={provider.brandColor}
			providerGlowColor={provider.glowColor}
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
		<div className="flex items-center gap-2 min-w-0 transition-colors duration-300">
			<div className="relative flex-none">
				<Artwork
					src={session?.metadata.artwork ?? music.thumbnail}
					size={26}
					radius={8}
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
					className="flex max-w-47.5 min-w-0 flex-col"
					initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
					transition={{ duration: 0.22 }}
				>
					<Marquee
						text={session?.metadata.title ?? music.title}
						className="text-[12.5px]/[1.25] font-semibold transition-colors duration-300"
						style={{ color: theme.textPrimary }}
					/>
					{(session?.metadata.artist || music.artist) && (
						<Marquee
							text={session?.metadata.artist ?? music.artist}
							className="text-[10.5px]/[1.25] font-medium transition-colors duration-300"
							style={{ color: theme.textSecondary }}
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
	const theme = useMusicTheme();
	const visualizerColor = provider.id !== "generic" ? provider.brandColor : accent;

	return (
		<div className="flex items-center gap-2 flex-none transition-colors duration-300">
			<span
				className="text-[12px] font-semibold tabular-nums transition-colors duration-300"
				style={{ color: music.playing ? theme.textSecondary : theme.textMuted }}
			>
				{formatTime(position)}
			</span>
			{showVisualizer && <MusicVisualizer playing={music.playing} color={visualizerColor} height={18} barWidth={3} />}
		</div>
	);
}
