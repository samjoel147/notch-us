import { motion } from "motion/react";
import { type PointerEvent, useRef, useState } from "react";
import { useIsland } from "../../../core/island";
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
	const island = useIsland();
	const [hovering, setHovering] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [dragRatio, setDragRatio] = useState<number | null>(null);
	const trackRef = useRef<HTMLDivElement>(null);

	const validDuration = duration && duration > 0 ? duration : 0;
	const progress =
		dragRatio !== null ? dragRatio : validDuration > 0 ? Math.min(1, Math.max(0, position / validDuration)) : 0;

	const calcRatio = (clientX: number) => {
		if (!trackRef.current) return 0;
		const rect = trackRef.current.getBoundingClientRect();
		if (rect.width <= 0) return 0;
		return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
	};

	const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
		if (!canSeek || !validDuration || !trackRef.current) return;
		e.currentTarget.setPointerCapture(e.pointerId);
		setDragging(true);
		island.keepOpen(true, "seek");
		const ratio = calcRatio(e.clientX);
		setDragRatio(ratio);
	};

	const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
		if (dragging && canSeek && validDuration && trackRef.current) {
			const ratio = calcRatio(e.clientX);
			setDragRatio(ratio);
		}
	};

	const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
		if (dragging && canSeek && validDuration && trackRef.current) {
			const ratio = calcRatio(e.clientX);
			musicAction("seek", Math.round(ratio * validDuration));
			setDragging(false);
			setDragRatio(null);
			island.keepOpen(false, "seek");
		}
	};

	const handleLostPointerCapture = () => {
		if (dragging) {
			setDragging(false);
			setDragRatio(null);
			island.keepOpen(false, "seek");
		}
	};

	const fill = accentGradient || theme.progressFill;
	const currentSeconds = dragRatio !== null && validDuration ? Math.round(dragRatio * validDuration) : position;

	return (
		<div
			className="notch-music-player__timeline group/progress flex items-center gap-2.5 py-0.5 select-none"
			onMouseEnter={() => canSeek && setHovering(true)}
			onMouseLeave={() => setHovering(false)}
		>
			{/* Elapsed Time */}
			<span className="min-w-8 text-[11px] font-mono font-medium tabular-nums select-none text-text-dim/80 transition-colors duration-200">
				{formatTime(currentSeconds)}
			</span>

			{/* Progress Track */}
			<div
				ref={trackRef}
				className={`relative h-1 flex-1 rounded-full touch-none select-none transition-all duration-200 ${
					canSeek ? "cursor-pointer group-hover/progress:h-1.5" : "cursor-default"
				}`}
				style={{
					backgroundColor: theme.progressTrack || "var(--progress-track, var(--card))",
					boxShadow:
						theme.mode === "light" ? "inset 0 1px 2px 0 rgba(0, 0, 0, 0.08)" : "inset 0 1px 1px 0 rgba(0, 0, 0, 0.35)",
				}}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onLostPointerCapture={handleLostPointerCapture}
			>
				{/* Progress Fill */}
				<motion.div
					className="absolute inset-y-0 left-0 origin-left rounded-full shadow-[0_0_8px_var(--accent,rgba(255,255,255,0.35))]"
					style={{ background: fill }}
					initial={false}
					animate={{ scaleX: progress }}
					transition={{ type: "tween", ease: "linear", duration: dragging ? 0 : 0.18 }}
				/>

				{/* Glowing Playhead Thumb */}
				{canSeek && (
					<motion.div
						className="pointer-events-none absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.6)]"
						style={{ left: `calc(${progress * 100}% - 5px)` }}
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
			<span className="min-w-8 text-right text-[11px] font-mono font-medium tabular-nums select-none text-text-dim/80 transition-colors duration-200">
				{validDuration ? `-${formatTime(Math.max(0, validDuration - currentSeconds))}` : "--:--"}
			</span>
		</div>
	);
}
