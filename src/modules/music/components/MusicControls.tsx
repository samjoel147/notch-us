import { ExternalLinkIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "../../../core/cn";
import { musicAction } from "../hooks/useMusic";
import type { MediaCapabilities } from "../providers/types";

interface MusicControlsProps {
	playing: boolean;
	capabilities: MediaCapabilities;
	onOpenSource?: () => void;
}

export function MusicControls({ playing, capabilities, onOpenSource }: MusicControlsProps) {
	return (
		<div className="flex items-center gap-2.5">
			{/* Skip Previous */}
			<CtrlButton
				disabled={!capabilities.canSkipPrevious}
				title="Previous Track"
				onClick={() => musicAction("previous")}
			>
				<SkipBackIcon size={18} fill="currentColor" />
			</CtrlButton>

			{/* Primary Play / Pause Toggle Button */}
			<CtrlButton big title={playing ? "Pause" : "Play"} onClick={() => musicAction("toggle")}>
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.span
						key={playing ? "pause" : "play"}
						initial={{ scale: 0.4, opacity: 0, rotate: -25 }}
						animate={{ scale: 1, opacity: 1, rotate: 0 }}
						exit={{ scale: 0.4, opacity: 0, rotate: 25 }}
						transition={{ type: "spring", stiffness: 550, damping: 26 }}
						style={{ display: "grid" }}
					>
						{playing ? (
							<PauseIcon size={24} fill="currentColor" />
						) : (
							<PlayIcon size={24} fill="currentColor" className="translate-x-0.5" />
						)}
					</motion.span>
				</AnimatePresence>
			</CtrlButton>

			{/* Skip Next */}
			<CtrlButton disabled={!capabilities.canSkipNext} title="Next Track" onClick={() => musicAction("next")}>
				<SkipForwardIcon size={18} fill="currentColor" />
			</CtrlButton>

			{/* Open Source App (progressive disclosure) */}
			{capabilities.canOpenSource && onOpenSource && (
				<CtrlButton title="Bring player to front" onClick={onOpenSource} className="ml-1">
					<ExternalLinkIcon size={14} />
				</CtrlButton>
			)}
		</div>
	);
}

function CtrlButton({
	children,
	onClick,
	disabled,
	big,
	title,
	className,
}: {
	children: ReactNode;
	onClick: () => void;
	disabled?: boolean;
	big?: boolean;
	title?: string;
	className?: string;
}) {
	return (
		<motion.button
			title={title}
			className={cn(
				"relative grid place-items-center rounded-full transition-all duration-200 disabled:pointer-events-none disabled:opacity-25",
				big
					? "size-11 shadow-lg bg-black/6 dark:bg-white/12 text-text"
					: "size-8 text-text-dim hover:text-text active:scale-92",
				className,
			)}
			style={{
				boxShadow: big ? "inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.25), 0 3px 10px rgba(0, 0, 0, 0.12)" : undefined,
			}}
			disabled={disabled}
			whileHover={{ scale: big ? 1.06 : 1.1 }}
			whileTap={{ scale: big ? 0.9 : 0.86 }}
			transition={{ type: "spring", stiffness: 600, damping: 22 }}
			onClick={(e: MouseEvent<HTMLButtonElement>) => {
				e.stopPropagation();
				onClick();
			}}
		>
			{big && (
				<div className="pointer-events-none absolute inset-x-0 top-0 h-[48%] rounded-t-full opacity-40 bg-gradient-to-b from-white/30 to-transparent" />
			)}
			{children}
		</motion.button>
	);
}
