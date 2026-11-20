import { AnimatePresence, motion } from "motion/react";
import { useAppearance } from "../../../core/appearance";
import { useSetting } from "../../../core/settings";
import { normalizeMediaSession } from "../core/MediaSessionNormalizer";
import { useAccentColor } from "../hooks/useAccentColor";
import { useMusic } from "../hooks/useMusic";
import { getProviderDefinition } from "../providers/registry";
import { musicSettings } from "../settings";
import { useMusicTheme } from "../themes/theme.provider";

/**
 * Ambient Rhythm Aura: A soft, breathing radial glow blooming behind
 * the dynamic island onto the desktop, synchronizing to playback and tinted
 * by the active album artwork palette (20% atmospheric lighting rule).
 */
export function RhythmAura() {
	const { music } = useMusic();
	const look = useAppearance();
	const ambientEnabled = useSetting(musicSettings.ambientGlow);
	const glowSetting = useSetting(musicSettings.glowIntensity) || "vibrant";
	const accent = useAccentColor(music?.thumbnail);
	const theme = useMusicTheme();

	const isPlaying = !!music?.playing && !!music.title;
	if (!ambientEnabled || glowSetting === "off" || !isPlaying) {
		return null;
	}

	const session = normalizeMediaSession(music, 0);
	const provider = getProviderDefinition(session?.source.providerId ?? "generic");
	const glowColor = accent || (provider.id !== "generic" ? provider.brandColor : theme.accentPrimary) || "#007aff";

	const isLight = look.theme === "light" || look.theme === "glass-light";

	// Scale opacity multiplier according to user glow preference and theme contrast
	const baseOpacity =
		glowSetting === "subtle"
			? isLight
				? 0.1
				: 0.2
			: glowSetting === "immersive"
				? isLight
					? 0.28
					: 0.6
				: isLight
					? 0.18
					: 0.38;

	const prefersReducedMotion =
		typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

	return (
		<AnimatePresence>
			<motion.div
				key={`rhythm-aura-${music.title}`}
				className="pointer-events-none absolute -inset-3 -z-20 rounded-[inherit] will-change-transform"
				style={{
					background: `radial-gradient(circle at 50% 40%, ${glowColor} 0%, transparent 72%)`,
					filter: "blur(32px)",
				}}
				initial={{ opacity: 0, scale: 0.95 }}
				animate={
					prefersReducedMotion
						? { opacity: baseOpacity, scale: 1 }
						: {
								opacity: [baseOpacity * 0.8, baseOpacity * 1.2, baseOpacity * 0.8],
								scale: [1, 1.04, 1],
							}
				}
				exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
				transition={
					prefersReducedMotion
						? { duration: 0.3 }
						: {
								repeat: Number.POSITIVE_INFINITY,
								duration: 2.8,
								ease: "easeInOut",
							}
				}
			/>
		</AnimatePresence>
	);
}
