import { THEME_REGISTRY } from "./theme.registry";
import type { MusicThemeTokens, ThemeCompositionContext } from "./theme.types";

/**
 * Resolves full semantic design tokens blending:
 * Theme identity (70%) + Artwork atmosphere (20%) + Provider identity (10%).
 */
export function resolveMusicAppearance(ctx: ThemeCompositionContext): MusicThemeTokens {
	// 1. Resolve AUTO to glass-dark or glass-light
	const effectiveThemeId = ctx.themeId === "auto" ? (ctx.systemIsDark ? "glass-dark" : "glass-light") : ctx.themeId;

	const base = THEME_REGISTRY[effectiveThemeId] ?? THEME_REGISTRY["glass-dark"];

	// 2. Compute dynamic ambient glows and accents based on theme rules
	let ambientGlow: string;
	let ambientGlowSecondary: string;
	let accentPrimary: string;
	let progressFill: string;
	let artworkShadow: string;

	if (effectiveThemeId === "cyberpunk") {
		// Cyberpunk retains its high-energy cyan/magenta priority regardless of service
		accentPrimary = base.accentPrimary;
		progressFill = `linear-gradient(90deg, ${base.accentPrimary}, ${base.accentSecondary})`;
		// Subtle complementary artwork atmosphere blended behind cyan/magenta
		ambientGlow = ctx.artworkVibrant
			? `radial-gradient(circle at 22% 50%, color-mix(in srgb, ${ctx.artworkVibrant} 30%, ${base.accentSecondary}) 0%, transparent 68%)`
			: base.ambientGlow;
		ambientGlowSecondary = base.ambientGlowSecondary;
		artworkShadow = `0 14px 34px -6px ${ctx.providerBrandColor}66, 0 0 20px -2px ${base.accentPrimary}44`;
	} else if (effectiveThemeId === "midnight") {
		// Midnight retains its curated navy & sky-blue identity
		accentPrimary = base.accentPrimary;
		progressFill = `linear-gradient(90deg, ${base.accentPrimary}, ${base.accentSecondary})`;
		ambientGlow = `radial-gradient(circle at 22% 50%, color-mix(in srgb, ${ctx.artworkVibrant || base.accentPrimary} 45%, ${base.accentPrimary}) 0%, transparent 68%)`;
		ambientGlowSecondary = ctx.artworkSecondary
			? `radial-gradient(circle at 75% 50%, color-mix(in srgb, ${ctx.artworkSecondary} 25%, transparent) 0%, transparent 60%)`
			: base.ambientGlowSecondary;
		artworkShadow = `0 14px 32px -6px ${base.accentPrimary}40, 0 4px 14px -2px rgba(0, 0, 0, 0.5)`;
	} else if (effectiveThemeId === "sunset") {
		// Sunset retains its curated warm amber & coral identity
		accentPrimary = base.accentPrimary;
		progressFill = `linear-gradient(90deg, ${base.accentPrimary}, ${base.accentSecondary})`;
		ambientGlow = `radial-gradient(circle at 22% 50%, color-mix(in srgb, ${ctx.artworkVibrant || base.accentPrimary} 45%, ${base.accentPrimary}) 0%, transparent 68%)`;
		ambientGlowSecondary = ctx.artworkSecondary
			? `radial-gradient(circle at 75% 50%, color-mix(in srgb, ${ctx.artworkSecondary} 25%, transparent) 0%, transparent 60%)`
			: base.ambientGlowSecondary;
		artworkShadow = `0 14px 32px -6px ${base.accentPrimary}40, 0 4px 14px -2px rgba(0, 0, 0, 0.5)`;
	} else if (effectiveThemeId === "aurora") {
		// Aurora retains its curated emerald & mint identity
		accentPrimary = base.accentPrimary;
		progressFill = `linear-gradient(90deg, ${base.accentPrimary}, ${base.accentSecondary})`;
		ambientGlow = `radial-gradient(circle at 22% 50%, color-mix(in srgb, ${ctx.artworkVibrant || base.accentPrimary} 45%, ${base.accentPrimary}) 0%, transparent 68%)`;
		ambientGlowSecondary = ctx.artworkSecondary
			? `radial-gradient(circle at 75% 50%, color-mix(in srgb, ${ctx.artworkSecondary} 25%, transparent) 0%, transparent 60%)`
			: base.ambientGlowSecondary;
		artworkShadow = `0 14px 32px -6px ${base.accentPrimary}40, 0 4px 14px -2px rgba(0, 0, 0, 0.5)`;
	} else if (base.mode === "light") {
		// Light / Glass-Light: Restrained watercolor tints, zero washed out text
		const artworkColor = ctx.artworkVibrant || base.accentPrimary;
		accentPrimary = artworkColor;
		progressFill = `linear-gradient(90deg, ${artworkColor}, ${ctx.artworkMuted || artworkColor})`;
		ambientGlow = `radial-gradient(circle at 20% 50%, color-mix(in srgb, ${artworkColor} 65%, transparent) 0%, rgba(0,0,0,0.03) 50%, transparent 75%)`;
		ambientGlowSecondary = ctx.artworkSecondary
			? `radial-gradient(circle at 80% 50%, color-mix(in srgb, ${ctx.artworkSecondary} 20%, transparent) 0%, transparent 65%)`
			: base.ambientGlowSecondary;
		artworkShadow = "0 10px 24px -6px rgba(0, 0, 0, 0.16)";
	} else {
		// Dark / Glass-Dark (Dynamic Canvas + Obsidian)
		const artworkColor = ctx.artworkVibrant || base.accentPrimary;
		accentPrimary = artworkColor;
		progressFill = `linear-gradient(90deg, ${artworkColor}, ${ctx.artworkMuted || artworkColor})`;
		ambientGlow = `radial-gradient(circle at 22% 50%, ${artworkColor} 0%, transparent 68%)`;
		ambientGlowSecondary = ctx.artworkSecondary
			? `radial-gradient(circle at 78% 45%, color-mix(in srgb, ${ctx.artworkSecondary} 40%, transparent) 0%, transparent 62%)`
			: ctx.artworkMuted || base.ambientGlowSecondary;
		artworkShadow = `0 14px 32px -6px ${artworkColor}50, 0 4px 14px -2px rgba(0, 0, 0, 0.5)`;
	}

	return {
		id: ctx.themeId,
		mode: base.mode,
		isGlass: base.isGlass,
		background: base.background,
		backgroundSecondary: base.backgroundSecondary,
		surface: base.surface,
		surfaceElevated: base.surfaceElevated,
		surfaceControl: base.surfaceControl,
		textPrimary: base.textPrimary,
		textSecondary: base.textSecondary,
		textMuted: base.textMuted,
		border: base.border,
		borderHighlight: base.borderHighlight,
		rimSpecular: base.rimSpecular,
		sheenGradient: base.sheenGradient,
		accentPrimary,
		accentSecondary: base.accentSecondary,
		ambientGlow,
		ambientGlowSecondary,
		artworkShadow,
		progressTrack: base.progressTrack,
		progressFill,
		controlSurface: base.controlSurface,
		controlHover: base.controlHover,
		controlActive: base.controlActive,
		controlIcon: base.controlIcon,
		controlIconMuted: base.controlIconMuted,
		tooltipBackground: base.tooltipBackground,
		tooltipText: base.tooltipText,
		blur: base.blur,
		cardShadow: base.cardShadow,
	};
}
