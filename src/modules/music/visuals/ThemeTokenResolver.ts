import type { ThemeDef } from "../../../core/theme";
import type { ProviderBrandDefinition } from "../providers/types";
import type { ArtworkPalette } from "./ArtworkPaletteEngine";
import { computeContrastSafeColors } from "./ContrastGuard";

export interface MusicVisualTokens {
	surface: string;
	surfaceElevated: string;
	textPrimary: string;
	textSecondary: string;
	textMuted: string;
	border: string;
	borderHighlight: string;
	accent: string;
	accentSoft: string;
	artworkGlow: string;
	ambientGlow: string;
	controlSurface: string;
	controlHover: string;
	progressTrack: string;
	progressFill: string;
}

export function resolveThemeTokens(
	theme: ThemeDef,
	palette: ArtworkPalette,
	provider: ProviderBrandDefinition,
): MusicVisualTokens {
	const contrast = computeContrastSafeColors(theme.isLight, theme.isGlass);

	// In light themes, ensure the accent isn't washed out
	const effectiveAccent = theme.isLight
		? provider.secondaryAccent || provider.brandColor
		: palette.vibrant || provider.brandColor;

	const progressFill = `linear-gradient(90deg, ${palette.vibrant}, ${provider.brandColor})`;
	const progressTrack = theme.isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.12)";

	return {
		surface: theme.previewBg,
		surfaceElevated: theme.isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.06)",
		textPrimary: contrast.textPrimary,
		textSecondary: contrast.textSecondary,
		textMuted: contrast.textMuted,
		border: contrast.surfaceBorder,
		borderHighlight: theme.isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.25)",
		accent: effectiveAccent,
		accentSoft: `${effectiveAccent}33`,
		artworkGlow: provider.brandColor,
		ambientGlow: `radial-gradient(ellipse at 20% 50%, ${provider.glowColor} 0%, ${palette.glow} 45%, transparent 75%)`,
		controlSurface: contrast.controlBackground,
		controlHover: contrast.controlHover,
		progressTrack,
		progressFill,
	};
}
