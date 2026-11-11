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
		ambientGlow = base.ambientGlow;
		ambientGlowSecondary = base.ambientGlowSecondary;
		artworkShadow = `0 14px 34px -6px ${ctx.providerBrandColor}66, 0 0 20px -2px ${base.accentPrimary}44`;
	} else if (base.mode === "light") {
		// Light / Glass-Light: Restrained watercolor tints, zero washed out text
		accentPrimary = base.accentPrimary;
		progressFill = `linear-gradient(90deg, ${base.accentPrimary}, ${ctx.providerBrandColor})`;
		ambientGlow = `radial-gradient(circle at 18% 45%, ${ctx.providerGlowColor} 0%, rgba(0,0,0,0.04) 50%, transparent 75%)`;
		ambientGlowSecondary = base.ambientGlowSecondary;
		artworkShadow = "0 10px 24px -6px rgba(0, 0, 0, 0.16)";
	} else {
		// Dark / Glass-Dark / Midnight / Sunset / Aurora
		const artworkColor = ctx.artworkVibrant || base.accentPrimary;
		accentPrimary = base.accentPrimary;
		progressFill = `linear-gradient(90deg, ${artworkColor}, ${ctx.providerBrandColor})`;
		ambientGlow = `radial-gradient(ellipse at 20% 45%, ${ctx.providerGlowColor} 0%, ${base.ambientGlow} 40%, transparent 75%)`;
		ambientGlowSecondary = base.ambientGlowSecondary;
		artworkShadow = `0 14px 32px -6px ${ctx.providerBrandColor}55, 0 4px 12px -2px rgba(0,0,0,0.45)`;
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
