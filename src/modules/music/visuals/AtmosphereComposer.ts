import type { CSSProperties } from "react";
import type { ThemeDef } from "../../../core/theme";
import type { ProviderBrandDefinition } from "../providers/types";
import type { ArtworkPalette } from "./ArtworkPaletteEngine";
import { computeContrastSafeColors } from "./ContrastGuard";

export interface ComposedAtmosphere {
	backdropStyle: CSSProperties;
	sheenStyle: CSSProperties;
	cardShadow: string;
	artworkShadow: string;
	accentGradient: string;
	badgeStyle: CSSProperties;
}

export function composeAtmosphere(
	theme: ThemeDef,
	palette: ArtworkPalette,
	provider: ProviderBrandDefinition,
): ComposedAtmosphere {
	const contrast = computeContrastSafeColors(theme.isLight, theme.isGlass);

	const backdropStyle: CSSProperties = {
		background: `radial-gradient(circle at 18% 40%, ${provider.glowColor} 0%, ${palette.glow} 40%, transparent 75%)`,
		opacity: contrast.glowOpacity,
	};

	const sheenStyle: CSSProperties = {
		background: theme.isLight
			? "linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.2) 40%, transparent 100%)"
			: "linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.06) 42%, transparent 100%)",
	};

	const cardShadow = theme.isLight
		? "0 18px 42px -12px rgba(0, 0, 0, 0.12), 0 4px 14px -3px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(0, 0, 0, 0.08)"
		: `0 24px 50px -12px rgba(0, 0, 0, 0.78), 0 0 24px -4px ${provider.glowColor}, inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.35)`;

	const artworkShadow = `0 14px 32px -6px ${provider.brandColor}55, 0 4px 12px -2px rgba(0, 0, 0, 0.35)`;

	const accentGradient = `linear-gradient(90deg, ${palette.vibrant}, ${provider.brandColor})`;

	const badgeStyle: CSSProperties = {
		backgroundColor: provider.badgeBg,
		color: provider.badgeText,
		border: `1px solid ${provider.badgeBorder}`,
	};

	return {
		backdropStyle,
		sheenStyle,
		cardShadow,
		artworkShadow,
		accentGradient,
		badgeStyle,
	};
}
