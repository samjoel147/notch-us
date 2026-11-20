import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "../../../core/cn";
import { musicAction } from "../hooks/useMusic";
import type { MediaCapabilities } from "../providers/types";

interface MusicControlsProps {
	playing: boolean;
	capabilities: MediaCapabilities;
	accentColor?: string;
	onOpenSource?: () => void;
}

export function MusicControls({ playing, capabilities, accentColor }: MusicControlsProps) {
	return (
		<div className="flex items-center gap-1.5 select-none h-11 shrink-0 flex-none">
			{/* Skip Previous */}
			<CtrlButton
				disabled={!capabilities.canSkipPrevious}
				title="Previous Track"
				onClick={() => musicAction("previous")}
			>
				<SkipBackIcon size={17} strokeWidth={2.2} className="fill-current" />
			</CtrlButton>

			{/* Primary Play / Pause Toggle Button */}
			<CtrlButton
				big
				playing={playing}
				accentColor={accentColor}
				title={playing ? "Pause" : "Play"}
				onClick={() => musicAction("toggle")}
			>
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.span
						key={playing ? "pause" : "play"}
						initial={{ scale: 0.55, opacity: 0, rotate: playing ? -15 : 15 }}
						animate={{ scale: 1, opacity: 1, rotate: 0 }}
						exit={{ scale: 0.55, opacity: 0, rotate: playing ? 15 : -15 }}
						transition={{ type: "spring", stiffness: 550, damping: 28 }}
						style={{ display: "grid", placeItems: "center" }}
					>
						{playing ? (
							<PauseIcon size={20} strokeWidth={2.4} className="fill-current" />
						) : (
							<PlayIcon size={20} strokeWidth={2.4} className="fill-current translate-x-0.5" />
						)}
					</motion.span>
				</AnimatePresence>
			</CtrlButton>

			{/* Skip Next */}
			<CtrlButton disabled={!capabilities.canSkipNext} title="Next Track" onClick={() => musicAction("next")}>
				<SkipForwardIcon size={17} strokeWidth={2.2} className="fill-current" />
			</CtrlButton>
		</div>
	);
}

function toGlowColor(color: string | undefined): string {
	if (!color) return "rgba(255, 255, 255, 0.35)";
	if (color.startsWith("#")) {
		return `${color}66`;
	}
	if (color.startsWith("rgb(")) {
		return color.replace("rgb(", "rgba(").replace(")", ", 0.45)");
	}
	return color;
}

function CtrlButton({
	children,
	onClick,
	disabled,
	big,
	playing,
	accentColor,
	title,
	className,
}: {
	children: ReactNode;
	onClick: () => void;
	disabled?: boolean;
	big?: boolean;
	playing?: boolean;
	accentColor?: string;
	title?: string;
	className?: string;
}) {
	const glow = toGlowColor(accentColor);

	return (
		<motion.button
			title={title}
			className={cn(
				"relative grid place-items-center rounded-full shrink-0 flex-none transition-all duration-200 disabled:pointer-events-none disabled:opacity-25",
				big
					? "size-11 text-text border border-hairline bg-card hover:bg-white/10 dark:hover:bg-white/18 active:scale-95 shadow-sm"
					: "size-8 text-text-dim hover:text-text hover:bg-card active:scale-90",
				className,
			)}
			style={
				big
					? {
							boxShadow: playing
								? `var(--specular), 0 4px 18px -2px ${glow}`
								: "var(--specular), 0 3px 12px rgba(0, 0, 0, 0.25)",
						}
					: undefined
			}
			disabled={disabled}
			whileHover={{ scale: big ? 1.04 : 1.08 }}
			whileTap={{ scale: big ? 0.94 : 0.88 }}
			transition={{ type: "spring", stiffness: 600, damping: 25 }}
			onClick={(e: MouseEvent<HTMLButtonElement>) => {
				e.stopPropagation();
				onClick();
			}}
		>
			{big && (
				<div
					className="pointer-events-none absolute inset-x-0 top-0 h-[48%] rounded-t-full opacity-40"
					style={{
						background: "var(--glass-sheen, linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, transparent 100%))",
					}}
				/>
			)}
			{children}
		</motion.button>
	);
}
