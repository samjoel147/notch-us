import type { GlassMaterialId } from "../materials/material.types";
import type { MusicThemeTokens } from "../themes/theme.types";
import type { ArtworkPalette } from "./ArtworkPaletteEngine";

/**
 * Semantic visual tokens emitted by the Artwork Atmosphere Engine.
 * Represents Layer 2 (Artwork Colour Wash) and Layer 3 (Localized Artwork Bloom),
 * integrated into Layer 1 (Global Theme) and Layer 4 (Material Optical Finish).
 */
export interface ArtworkAtmosphereTokens {
	/** Layer 2: Subtle pervasive color wash spanning across the player body */
	surfaceWash: string;
	/** Layer 2: Supporting secondary wash gradient */
	surfaceWashSecondary: string;
	/** Layer 3: Soft primary radial illumination focused around the album art */
	primaryBloom: string;
	/** Layer 3: Secondary atmospheric gradient spreading toward the right */
	secondaryBloom: string;
	/** Subtle perimeter highlight influenced by vibrant artwork tint */
	edgeAccent: string;
	/** Calculated perceptual atmosphere intensity scalar [0.0 - 1.0] */
	intensity: number;
	/** Living Fluid Mesh Canvas: Whole-surface dual-tone organic fluid gradient */
	fluidMeshBackground: string;
	/** Primary extracted color vector */
	primaryColor: string;
	/** Secondary extracted color vector */
	secondaryColor: string;
}

/**
 * Calculates adaptive atmosphere intensity scalar based on theme luminance,
 * material characteristics, and artwork saturation.
 */
export function calculateAtmosphereIntensity(
	theme: MusicThemeTokens,
	materialId: GlassMaterialId,
	palette: ArtworkPalette,
): number {
	// Base intensity tuned for default presentation: balanced and subtle
	let base = theme.mode === "light" ? 0.35 : 0.65;

	// Scale down slightly for solid opaque themes (Dark, Light) to avoid muddy surface
	if (!theme.isGlass) {
		base *= 0.8;
	}

	// Material specific transmission modulation
	if (materialId === "smoked") {
		base *= 0.7; // Smoked glass absorbs more light, stays restrained
	} else if (materialId === "frosted") {
		base *= 0.9; // Frosted glass diffuses gently
	} else if (materialId === "crystal") {
		base *= 0.85; // Crystal glass prioritizes optical transparency
	} else if (materialId === "adaptive") {
		base *= 1.15; // Adaptive glass embraces artwork harmonization
	}

	// Artwork luminance and saturation weighting
	if (palette.isMonochrome) {
		base *= 0.4;
	} else if (palette.isLight && theme.mode === "light") {
		base *= 0.6; // Avoid washing out bright light themes
	} else if (palette.isDark && theme.mode === "dark") {
		base *= 0.75;
	}

	return Math.min(1, Math.max(0.1, base));
}

/**
 * Resolves the 4-layer Artwork Atmosphere Engine tokens.
 * The existing global theme and material remain authoritative; the artwork atmosphere
 * naturally diffuses into the existing surface without overriding it.
 */
export function resolveArtworkAtmosphere(
	theme: MusicThemeTokens,
	materialId: GlassMaterialId,
	palette: ArtworkPalette,
): ArtworkAtmosphereTokens {
	const intensity = calculateAtmosphereIntensity(theme, materialId, palette);
	const vibrant = palette.vibrant;
	const secondary = palette.secondary;
	const comp = palette.complementary;
	const isLight = theme.mode === "light";

	// --- LAYER 2: ARTWORK COLOUR WASH ---
	// Subtle translucent wash extending across the player container
	const washAlpha = (isLight ? 0.045 : 0.08) * intensity;
	const washAlphaSecondary = (isLight ? 0.025 : 0.04) * intensity;

	const surfaceWash = `linear-gradient(135deg, color-mix(in srgb, ${vibrant} ${Math.round(washAlpha * 100)}%, transparent) 0%, color-mix(in srgb, ${secondary} ${Math.round(washAlphaSecondary * 100)}%, transparent) 100%)`;
	const surfaceWashSecondary = `linear-gradient(90deg, color-mix(in srgb, ${vibrant} ${Math.round(washAlpha * 80)}%, transparent) 0%, transparent 70%)`;

	// --- LAYER 3: LOCALIZED ARTWORK BLOOM ---
	// Radial bloom originating around the artwork (approx. 22% X, 50% Y)
	// fading outward toward controls so it feels like natural light emission
	const bloomAlpha = (isLight ? 0.18 : 0.42) * intensity;
	const bloomAlphaSecondary = (isLight ? 0.1 : 0.22) * intensity;

	let primaryBloom: string;
	let secondaryBloom: string;

	if (theme.id === "cyberpunk") {
		// Cyberpunk: Preserve neon identity while allowing artwork bloom
		primaryBloom = `radial-gradient(circle at 22% 50%, color-mix(in srgb, ${vibrant} 35%, rgba(0, 240, 255, 0.4)) 0%, transparent 68%)`;
		secondaryBloom = `radial-gradient(circle at 75% 50%, color-mix(in srgb, ${secondary} 25%, rgba(255, 0, 127, 0.2)) 0%, transparent 60%)`;
	} else if (theme.id === "midnight") {
		// Midnight: Preserve navy/icy blue
		primaryBloom = `radial-gradient(circle at 22% 50%, color-mix(in srgb, ${vibrant} 40%, rgba(56, 189, 248, 0.5)) 0%, transparent 70%)`;
		secondaryBloom = `radial-gradient(circle at 78% 45%, color-mix(in srgb, ${comp} 22%, transparent) 0%, transparent 62%)`;
	} else if (theme.id === "sunset") {
		// Sunset: Preserve amber/coral
		primaryBloom = `radial-gradient(circle at 22% 50%, color-mix(in srgb, ${vibrant} 45%, rgba(251, 146, 60, 0.5)) 0%, transparent 70%)`;
		secondaryBloom = `radial-gradient(circle at 78% 45%, color-mix(in srgb, ${secondary} 25%, transparent) 0%, transparent 62%)`;
	} else if (theme.id === "aurora") {
		// Aurora: Preserve emerald/mint
		primaryBloom = `radial-gradient(circle at 22% 50%, color-mix(in srgb, ${vibrant} 40%, rgba(52, 211, 153, 0.5)) 0%, transparent 70%)`;
		secondaryBloom = `radial-gradient(circle at 78% 45%, color-mix(in srgb, ${secondary} 25%, transparent) 0%, transparent 62%)`;
	} else if (isLight) {
		// Light / Glass Light: Restrained watercolor bloom, zero text blowout
		primaryBloom = `radial-gradient(circle at 20% 50%, color-mix(in srgb, ${vibrant} ${Math.round(bloomAlpha * 100)}%, transparent) 0%, rgba(0, 0, 0, 0.02) 50%, transparent 75%)`;
		secondaryBloom = `radial-gradient(circle at 80% 50%, color-mix(in srgb, ${secondary} ${Math.round(bloomAlphaSecondary * 100)}%, transparent) 0%, transparent 65%)`;
	} else {
		// Glass Dark & Dark: Obsidian background with deep immersive artwork glow
		primaryBloom = `radial-gradient(circle at 22% 50%, color-mix(in srgb, ${vibrant} ${Math.round(bloomAlpha * 100)}%, transparent) 0%, transparent 68%)`;
		secondaryBloom = `radial-gradient(circle at 78% 45%, color-mix(in srgb, ${secondary} ${Math.round(bloomAlphaSecondary * 100)}%, transparent) 0%, transparent 64%)`;
	}

	// --- LAYER 4: MATERIAL INTERACTION ACCENT ---
	const edgeAccent = `color-mix(in srgb, ${vibrant} 25%, ${theme.border})`;

	// --- LIVING FLUID MESH CANVAS (Apple Music & Android Monet inspired) ---
	// Asymmetrical dual-tone organic fluid mesh spanning the entire player body
	const meshAlphaPrimary = (isLight ? 0.14 : 0.28) * intensity;
	const meshAlphaSecondary = (isLight ? 0.09 : 0.18) * intensity;
	const fluidMeshBackground = [
		`radial-gradient(ellipse 65% 85% at 18% 36%, color-mix(in srgb, ${vibrant} ${Math.round(meshAlphaPrimary * 100)}%, transparent) 0%, transparent 72%)`,
		`radial-gradient(ellipse 75% 70% at 84% 68%, color-mix(in srgb, ${secondary} ${Math.round(meshAlphaSecondary * 100)}%, transparent) 0%, transparent 70%)`,
		`radial-gradient(circle at 50% 100%, color-mix(in srgb, ${vibrant} ${Math.round(meshAlphaPrimary * 50)}%, transparent) 0%, transparent 60%)`,
		`linear-gradient(135deg, color-mix(in srgb, ${vibrant} ${Math.round(washAlpha * 80)}%, transparent) 0%, color-mix(in srgb, ${secondary} ${Math.round(washAlphaSecondary * 80)}%, transparent) 100%)`,
	].join(", ");

	return {
		surfaceWash,
		surfaceWashSecondary,
		primaryBloom,
		secondaryBloom,
		edgeAccent,
		intensity,
		fluidMeshBackground,
		primaryColor: vibrant,
		secondaryColor: secondary,
	};
}
