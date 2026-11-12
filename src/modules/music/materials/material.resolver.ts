import type { CSSProperties } from "react";
import type { MusicThemeTokens } from "../themes/theme.types";
import type { ArtworkPalette } from "../visuals/ArtworkPaletteEngine";
import { MATERIAL_REGISTRY } from "./material.registry";
import type { ComputedMaterialProperties, GlassMaterialId, MaterialTokens } from "./material.types";

/**
 * Resolves final CSS properties for a selected glass material, harmonized with
 * the active theme tokens and optional dynamic artwork palette.
 */
export function resolveMaterial(
	materialId: GlassMaterialId,
	theme: MusicThemeTokens,
	artwork?: ArtworkPalette | null,
): ComputedMaterialProperties {
	const template: MaterialTokens = MATERIAL_REGISTRY[materialId] ?? MATERIAL_REGISTRY.liquid;

	// For adaptive material, blend artwork dominant/vibrant color into surfaceTint and sheen
	let computedTint = template.surfaceTint;
	let computedSheen = template.sheenGradient;
	let computedRim = template.rimSpecular;
	let computedBorder = template.borderHighlight;

	if (materialId === "adaptive" && artwork?.vibrant) {
		computedTint = `color-mix(in srgb, ${artwork.vibrant} 16%, ${theme.mode === "light" ? "rgba(255, 255, 255, 0.85)" : "rgba(18, 20, 28, 0.75)"})`;
		computedSheen = `linear-gradient(180deg, color-mix(in srgb, ${artwork.vibrant} 35%, rgba(255, 255, 255, 0.6)) 0%, rgba(255, 255, 255, 0.08) 42%, transparent 100%)`;
		computedRim = `inset 0 1.5px 1.5px 0 color-mix(in srgb, ${artwork.vibrant} 45%, #ffffff), inset 0 0 0 1px rgba(255, 255, 255, 0.25), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.3)`;
		computedBorder = `color-mix(in srgb, ${artwork.vibrant} 40%, rgba(255, 255, 255, 0.35))`;
	} else if (theme.mode === "light" && materialId !== "smoked") {
		// In light mode, frosted and crystal glass use bright translucent layers
		computedTint =
			materialId === "crystal"
				? "rgba(255, 255, 255, 0.55)"
				: materialId === "frosted"
					? "rgba(255, 255, 255, 0.82)"
					: "rgba(255, 255, 255, 0.72)";
		computedSheen =
			"linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.35) 45%, transparent 100%)";
		computedRim =
			"inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 1), inset 0 0 0 1px rgba(255, 255, 255, 0.85), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.06)";
		computedBorder = "rgba(0, 0, 0, 0.08)";
	}

	const style: CSSProperties = {
		backgroundColor: computedTint,
		boxShadow: computedRim,
		backgroundImage: computedSheen,
		borderColor: computedBorder,
	};

	return {
		style,
		className: template.blur,
	};
}
