import { MusicIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMusicTheme } from "../themes/theme.provider";

/** Album art with optical glass sheen, theme-aware atmosphere, and specular rim. */
export function Artwork({
	src,
	size,
	radius,
	trackKey,
	glow,
}: {
	src: string | null | undefined;
	size: number;
	radius: number;
	trackKey?: string;
	glow?: string;
}) {
	const theme = useMusicTheme();

	const shadow = glow
		? `0 14px 34px -6px ${glow}70, 0 4px 12px -2px ${glow}40, inset 0 0 0 1px ${theme.border}`
		: theme.artworkShadow;

	return (
		<div
			className="group/art relative flex-none overflow-hidden transition-all duration-500 ease-[ease]"
			style={{
				width: size,
				height: size,
				borderRadius: radius,
				backgroundColor: theme.mode === "light" ? "#f4f4f6" : "#1c1c1f",
				boxShadow: shadow,
			}}
		>
			<AnimatePresence initial={false}>
				<motion.div
					key={trackKey ?? src ?? "none"}
					className="absolute inset-0 grid place-items-center bg-cover bg-center text-text-faint"
					initial={{ opacity: 0, scale: 1.15, filter: "blur(4px)" }}
					animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.35, ease: [0.2, 0.9, 0.3, 1] }}
					style={src ? { backgroundImage: `url("${src}")` } : undefined}
				>
					{!src && <MusicIcon size={size * 0.45} />}
				</motion.div>
			</AnimatePresence>

			{/* Optical glass sheen reflection layer */}
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-[52%] rounded-t-[inherit] opacity-70 transition-opacity duration-300 group-hover/art:opacity-90"
				style={{ background: theme.sheenGradient }}
			/>

			{/* Inset perimeter highlight */}
			<div
				className="pointer-events-none absolute inset-0 rounded-[inherit]"
				style={{
					boxShadow:
						theme.mode === "light"
							? "inset 0 1px 1px 0 rgba(255,255,255,0.9), inset 0 -1px 1px 0 rgba(0,0,0,0.08)"
							: "inset 0 1px 1px 0 rgba(255,255,255,0.35), inset 0 -1px 1px 0 rgba(0,0,0,0.25)",
				}}
			/>
		</div>
	);
}
