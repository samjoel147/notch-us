import { motion } from "motion/react";
import { type MouseEvent, useRef, useState } from "react";
import { formatTime, musicAction } from "../hooks/useMusic";
import { useMusicTheme } from "../themes/theme.provider";

interface MusicProgressProps {
	position: number;
	duration?: number;
	canSeek: boolean;
	accentGradient?: string;
}

export function MusicProgress({ position, duration, canSeek, accentGradient }: MusicProgressProps) {
	const theme = useMusicTheme();
	const [hovering, setHovering] = useState(false);
	const [dragging, setDragging] = useState(false);
	const trackRef = useRef<HTMLDivElement>(null);

	const progress = duration && duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;

	const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
		if (!canSeek || !duration || !trackRef.current) return;
		const rect = trackRef.current.getBoundingClientRect();
		const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
		musicAction("seek", Math.round(ratio * duration));
	};

	const fill = accentGradient || theme.progressFill;

	return (
		<div
			className="group/progress flex items-center gap-2.5 py-0.5"
			onMouseEnter={() => canSeek && setHovering(true)}
			onMouseLeave={() => {
				setHovering(false);
				setDragging(false);
			}}
		>
			{/* Elapsed Time */}
			<span
				className="min-w-9 text-[11px] font-mono font-medium tabular-nums select-none transition-colors duration-300"
				style={{ color: theme.textMuted }}
			>
				{formatTime(position)}
			</span>

			{/* Progress Track */}
			<div
				ref={trackRef}
				className={`relative h-1.5 flex-1 rounded-full transition-all duration-200 ${
					canSeek ? "cursor-pointer group-hover/progress:h-2" : "cursor-default"
				}`}
				style={{ backgroundColor: theme.progressTrack }}
				onClick={handleSeek}
				onMouseDown={() => canSeek && setDragging(true)}
				onMouseUp={() => setDragging(false)}
			>
				{/* Progress Fill */}
				<motion.div
					className="absolute inset-y-0 left-0 origin-left rounded-full"
					style={{ background: fill }}
					initial={false}
					animate={{ scaleX: progress }}
					transition={{ type: "tween", ease: "linear", duration: 0.2 }}
				/>

				{/* Glowing Playhead Thumb (only when seekable and hovering/dragging) */}
				{canSeek && (
					<motion.div
						className="pointer-events-none absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.4)]"
						style={{ left: `calc(${progress * 100}% - 6px)` }}
						initial={{ opacity: 0, scale: 0.6 }}
						animate={{
							opacity: hovering || dragging ? 1 : 0,
							scale: hovering || dragging ? 1 : 0.6,
						}}
						transition={{ duration: 0.15 }}
					/>
				)}
			</div>

			{/* Remaining Time */}
			<span
				className="min-w-9 text-right text-[11px] font-mono font-medium tabular-nums select-none transition-colors duration-300"
				style={{ color: theme.textMuted }}
			>
				{duration ? `-${formatTime(Math.max(0, duration - position))}` : "--:--"}
			</span>
		</div>
	);
}
