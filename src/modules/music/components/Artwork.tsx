import { MusicIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

/** Album art with optical glass sheen and atmospheric glow. */
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
	return (
		<div
			className="group/art relative flex-none overflow-hidden bg-[#1c1c1f] transition-all duration-500 ease-[ease]"
			style={{
				width: size,
				height: size,
				borderRadius: radius,
				boxShadow: glow
					? `0 14px 34px -6px ${glow}70, 0 4px 12px -2px ${glow}40, inset 0 0 0 1px rgba(255, 255, 255, 0.15)`
					: "0 10px 24px -6px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.12)",
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
				style={{
					background:
						"linear-gradient(180deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.08) 42%, transparent 100%)",
				}}
			/>

			{/* Inset perimeter highlight */}
			<div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.35),inset_0_-1px_1px_0_rgba(0,0,0,0.25)]" />
		</div>
	);
}
