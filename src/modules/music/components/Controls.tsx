import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../../../core/cn";
import { type MusicState, musicAction } from "../hooks/useMusic";

export function Controls({ music, accent }: { music: MusicState; accent?: string }) {
	return (
		<div className="flex items-center gap-3">
			<CtrlButton disabled={!music.canPrevious} title="Previous Track" onClick={() => musicAction("previous")}>
				<SkipBackIcon size={19} fill="currentColor" />
			</CtrlButton>

			<CtrlButton big accent={accent} title={music.playing ? "Pause" : "Play"} onClick={() => musicAction("toggle")}>
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.span
						key={music.playing ? "pause" : "play"}
						initial={{ scale: 0.4, opacity: 0, rotate: -25 }}
						animate={{ scale: 1, opacity: 1, rotate: 0 }}
						exit={{ scale: 0.4, opacity: 0, rotate: 25 }}
						transition={{ type: "spring", stiffness: 550, damping: 26 }}
						style={{ display: "grid" }}
					>
						{music.playing ? (
							<PauseIcon size={24} fill="currentColor" />
						) : (
							<PlayIcon size={24} fill="currentColor" className="translate-x-0.5" />
						)}
					</motion.span>
				</AnimatePresence>
			</CtrlButton>

			<CtrlButton disabled={!music.canNext} title="Next Track" onClick={() => musicAction("next")}>
				<SkipForwardIcon size={19} fill="currentColor" />
			</CtrlButton>
		</div>
	);
}

function CtrlButton({
	children,
	onClick,
	disabled,
	big,
	accent,
	title,
}: {
	children: ReactNode;
	onClick: () => void;
	disabled?: boolean;
	big?: boolean;
	accent?: string;
	title?: string;
}) {
	return (
		<motion.button
			title={title}
			className={cn(
				"relative grid place-items-center rounded-full text-text transition-all duration-200 disabled:pointer-events-none disabled:opacity-30",
				big
					? "size-11 bg-white/12 shadow-[inset_0_1.5px_1px_0_rgba(255,255,255,0.4),0_6px_16px_rgba(0,0,0,0.3)] hover:bg-white/18 active:shadow-[inset_0_1px_1px_0_rgba(0,0,0,0.3)]"
					: "size-8.5 hover:bg-white/10 active:scale-92 text-text-dim hover:text-text",
			)}
			style={big && accent ? ({ "--ctrl-glow": accent } as React.CSSProperties) : undefined}
			disabled={disabled}
			whileHover={{ scale: big ? 1.06 : 1.1 }}
			whileTap={{ scale: big ? 0.9 : 0.86 }}
			transition={{ type: "spring", stiffness: 600, damping: 22 }}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
		>
			{big && (
				<div
					className="pointer-events-none absolute inset-x-0 top-0 h-[48%] rounded-t-full opacity-60"
					style={{
						background: "linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, transparent 100%)",
					}}
				/>
			)}
			{children}
		</motion.button>
	);
}
