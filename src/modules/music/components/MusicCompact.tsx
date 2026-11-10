import { AnimatePresence, motion } from "motion/react";
import { Marquee } from "../../../components/Marquee";
import { cn } from "../../../core/cn";
import { formatTime, type MusicState, useLivePosition } from "../hooks/useMusic";
import { detectMusicSource } from "../sources";
import { Artwork } from "./Artwork";
import { Visualizer } from "./Visualizer";

/** Left slot of the compact pill: artwork + streaming indicator + title over artist. */
export function MusicCompactLeft({ music }: { music: MusicState }) {
	const source = detectMusicSource(music);

	return (
		<div className="flex items-center gap-2 min-w-0">
			<div className="relative flex-none">
				<Artwork src={music.thumbnail} size={26} radius={8} trackKey={music.title} glow={source.brandColor} />
				<span
					className="pointer-events-none absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-black shadow-xs"
					style={{ backgroundColor: source.brandColor }}
					title={source.name}
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
					<Marquee text={music.title} className="text-[12.5px]/[1.25] font-semibold text-text" />
					{music.artist && <Marquee text={music.artist} className="text-[10.5px]/[1.25] font-medium text-text-dim" />}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}

/** Right slot: live playback position + streaming-colored visualizer. */
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
	const source = detectMusicSource(music);
	const visualizerColor = source.id !== "generic" ? source.brandColor : accent;

	return (
		<div className="flex items-center gap-2 flex-none">
			<span className={cn("text-[12px] font-semibold text-text-dim tabular-nums", !music.playing && "text-text-faint")}>
				{formatTime(position)}
			</span>
			{showVisualizer && <Visualizer playing={music.playing} color={visualizerColor} />}
		</div>
	);
}
