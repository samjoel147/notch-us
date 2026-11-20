import { MusicIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useMusicTheme } from "../themes/theme.provider";

function toGlowRgba(color: string | undefined, alpha = 0.35): string {
	if (!color) return `rgba(255, 255, 255, ${alpha})`;
	if (color.startsWith("#")) {
		const hexAlpha = Math.round(alpha * 255)
			.toString(16)
			.padStart(2, "0");
		return `${color}${hexAlpha}`;
	}
	if (color.startsWith("rgb(")) {
		return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
	}
	return color;
}

/** Album art with optical glass sheen, theme-aware atmosphere, and specular rim. */
export function Artwork({
	src,
	size,
	radius,
	trackKey,
	glow,
	badge,
}: {
	src: string | null | undefined;
	size: number;
	radius: number;
	trackKey?: string;
	glow?: string;
	badge?: ReactNode;
}) {
	const theme = useMusicTheme();

	const shadow = glow
		? theme.mode === "light"
			? `0 10px 24px -6px rgba(0, 0, 0, 0.16), 0 4px 12px -2px ${toGlowRgba(glow, 0.25)}, inset 0 0 0 1px rgba(0, 0, 0, 0.08)`
			: `0 14px 32px -6px rgba(0, 0, 0, 0.75), 0 4px 14px -2px ${toGlowRgba(glow, 0.35)}, inset 0 0 0 1px rgba(255, 255, 255, 0.14)`
		: theme.artworkShadow;

	return (
		<div className="relative flex-none select-none">
			<div
				className="group/art relative overflow-hidden transition-all duration-500 ease-[ease]"
				style={{
					width: size,
					height: size,
					borderRadius: radius,
					backgroundColor: theme.mode === "light" ? "#f4f4f6" : "#0d0d16",
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
					className="pointer-events-none absolute inset-x-0 top-0 h-[48%] rounded-t-[inherit] opacity-60 transition-opacity duration-300 group-hover/art:opacity-85"
					style={{ background: theme.sheenGradient }}
				/>

				{/* Inset perimeter highlight */}
				<div
					className="pointer-events-none absolute inset-0 rounded-[inherit]"
					style={{
						boxShadow:
							theme.mode === "light"
								? "inset 0 1px 1px 0 rgba(255,255,255,0.9), inset 0 -1px 1px 0 rgba(0,0,0,0.08)"
								: "inset 0 1.5px 1px 0 rgba(255,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 -1px 1px 0 rgba(0,0,0,0.35)",
					}}
				/>
			</div>
			{badge && (
				<div className="absolute -bottom-0.5 -right-0.5 z-10 pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
					{badge}
				</div>
			)}
		</div>
	);
}
