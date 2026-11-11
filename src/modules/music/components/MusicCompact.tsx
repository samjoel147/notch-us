import { AnimatePresence, motion } from "motion/react";
import { Marquee } from "../../../components/Marquee";
import { cn } from "../../../core/cn";
import { normalizeMediaSession } from "../core/MediaSessionNormalizer";
import { formatTime, type MusicState, useLivePosition } from "../hooks/useMusic";
import { getProviderDefinition } from "../providers/registry";
import { Artwork } from "./Artwork";
import { MusicVisualizer } from "./MusicVisualizer";

/** Left slot of the compact pill: artwork + provider badge dot + title over artist. */
export function MusicCompactLeft({ music }: { music: MusicState }) {
	const position = useLivePosition(music);
	const session = normalizeMediaSession(music, position);
	const provider = getProviderDefinition(session?.source.providerId ?? "generic");

	return (
		<div className="flex items-center gap-2 min-w-0">
			<div className="relative flex-none">
				<Artwork
					src={session?.metadata.artwork ?? music.thumbnail}
					size={26}
					radius={8}
					trackKey={session?.metadata.title ?? music.title}
					glow={provider.brandColor}
				/>
				<span
					className="pointer-events-none absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border border-black shadow-xs"
					style={{ backgroundColor: provider.brandColor }}
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
						className="text-[12.5px]/[1.25] font-semibold text-text"
					/>
					{(session?.metadata.artist || music.artist) && (
						<Marquee
							text={session?.metadata.artist ?? music.artist}
							className="text-[10.5px]/[1.25] font-medium text-text-dim"
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
	const visualizerColor = provider.id !== "generic" ? provider.brandColor : accent;

	return (
		<div className="flex items-center gap-2 flex-none">
			<span className={cn("text-[12px] font-semibold text-text-dim tabular-nums", !music.playing && "text-text-faint")}>
				{formatTime(position)}
			</span>
			{showVisualizer && <MusicVisualizer playing={music.playing} color={visualizerColor} height={18} barWidth={3} />}
		</div>
	);
}
