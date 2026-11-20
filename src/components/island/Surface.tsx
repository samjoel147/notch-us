import { AnimatePresence, motion, type Transition } from "motion/react";
import type { ReactNode } from "react";
import type { Appearance } from "../../core/appearance";
import { cn } from "../../core/cn";
import { draggingFiles } from "../../core/island";
import { GlassProbes } from "./GlassProbes";
import { cornerRadius, type Geo } from "./geometry";
import { PrivacyIndicator } from "./PrivacyIndicator";
import { glowStyle } from "./Rim";

/** The island's black body; its content blurs out and in whenever `contentKey` changes. */
export function Surface({
	g,
	big,
	look,
	transition,
	contentKey,
	rim,
	children,
}: {
	g: Geo;
	big: boolean;
	look: Appearance;
	transition: Transition;
	contentKey: string;
	rim: ReactNode;
	children: ReactNode;
}) {
	const windows = look.style === "windows";
	const dragging = draggingFiles.use();

	return (
		<motion.div
			data-glass
			className={cn(
				"absolute inset-0 overflow-hidden bg-island shadow-[var(--island-shadow)] backdrop-blur-2xl transition-[box-shadow,background-color] duration-400 ease-[ease]",
				big && "shadow-[var(--island-shadow-big)]",
				dragging && "shadow-[0_0_32px_rgba(100,210,255,0.4),var(--island-shadow-big)]",
			)}
			style={windows ? glowStyle(look) : undefined}
			initial={false}
			animate={cornerRadius(g, windows)}
			transition={transition}
		>
			{/* Liquid Glass optical top sheen layer */}
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-[48%] rounded-t-[inherit] transition-opacity duration-300"
				style={{ background: "var(--glass-sheen)" }}
			/>

			{/* Ambient drop target glow overlay when items are dragged over notch */}
			<AnimatePresence>
				{dragging && (
					<motion.div
						key="drop-target-glow"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] shadow-[inset_0_0_0_1.5px_rgba(100,210,255,0.7),0_0_24px_rgba(100,210,255,0.35)] bg-gradient-to-b from-[rgba(100,210,255,0.12)] via-[rgba(100,210,255,0.03)] to-transparent"
					>
						<div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#64D2FF] to-transparent animate-pulse" />
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence mode="popLayout" initial={false}>
				<motion.div
					key={contentKey}
					className="absolute top-0 left-1/2 origin-top -translate-x-1/2"
					style={{ width: g.width, height: g.height }}
					initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
					animate={{
						opacity: 1,
						scale: 1,
						filter: "blur(0px)",
						transition: { duration: 0.32, delay: 0.06, ease: [0.2, 0.9, 0.3, 1] },
					}}
					exit={{
						opacity: 0,
						scale: 0.94,
						filter: "blur(8px)",
						transition: { duration: 0.16, ease: "easeIn" },
					}}
				>
					{children}
				</motion.div>
			</AnimatePresence>
			<PrivacyIndicator big={big} />
			{rim}
			<div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[var(--specular)] transition-all duration-300" />
			<GlassProbes />
		</motion.div>
	);
}
