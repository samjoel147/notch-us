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
		// 5. ADAPTIVE: Strong artwork-aware tinting, sheen and colored specular rim
		computedTint = `color-mix(in srgb, ${artwork.vibrant} 16%, ${theme.mode === "light" ? "rgba(255, 255, 255, 0.85)" : "rgba(18, 20, 28, 0.75)"})`;
		computedSheen = `linear-gradient(180deg, color-mix(in srgb, ${artwork.vibrant} 35%, rgba(255, 255, 255, 0.6)) 0%, rgba(255, 255, 255, 0.08) 42%, transparent 100%)`;
		computedRim = `inset 0 1.5px 1.5px 0 color-mix(in srgb, ${artwork.vibrant} 45%, #ffffff), inset 0 0 0 1px rgba(255, 255, 255, 0.25), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.3)`;
		computedBorder = `color-mix(in srgb, ${artwork.vibrant} 40%, rgba(255, 255, 255, 0.35))`;
	} else if (materialId === "frosted" && artwork?.vibrant) {
		// 1. FROSTED: Soft diffuse transmission, milky light scattering with gentle artwork tint
		const baseTint = theme.mode === "light" ? "rgba(255, 255, 255, 0.82)" : "rgba(255, 255, 255, 0.14)";
		computedTint = `color-mix(in srgb, ${artwork.vibrant} 8%, ${baseTint})`;
		computedSheen = `linear-gradient(180deg, color-mix(in srgb, ${artwork.vibrant} 15%, rgba(255, 255, 255, 0.38)) 0%, rgba(255, 255, 255, 0.08) 45%, transparent 100%)`;
		computedRim = template.rimSpecular;
		computedBorder = template.borderHighlight;
	} else if (materialId === "crystal" && artwork?.vibrant) {
		// 2. CRYSTAL: Optical crisp edges, high transparency, artwork-refracted border highlight
		const baseTint = theme.mode === "light" ? "rgba(255, 255, 255, 0.55)" : "rgba(255, 255, 255, 0.05)";
		computedTint = baseTint;
		computedSheen = template.sheenGradient;
		computedRim = `inset 0 2px 1.5px 0 color-mix(in srgb, ${artwork.vibrant} 22%, rgba(255, 255, 255, 0.9)), inset 0 0 0 1px rgba(255, 255, 255, 0.32), inset 0 -1.5px 1px 0 rgba(0, 0, 0, 0.35)`;
		computedBorder = `color-mix(in srgb, ${artwork.vibrant} 30%, rgba(255, 255, 255, 0.45))`;
	} else if (materialId === "liquid" && artwork?.vibrant) {
		// 3. LIQUID: Directional optical reflections and layered fluid sheen with artwork refraction
		const baseTint = theme.mode === "light" ? "rgba(255, 255, 255, 0.72)" : "rgba(255, 255, 255, 0.10)";
		computedTint = `color-mix(in srgb, ${artwork.vibrant} 10%, ${baseTint})`;
		computedSheen = `linear-gradient(180deg, color-mix(in srgb, ${artwork.vibrant} 25%, rgba(255, 255, 255, 0.5)) 0%, rgba(255, 255, 255, 0.12) 36%, transparent 100%)`;
		computedRim = `inset 0 2px 2px 0 color-mix(in srgb, ${artwork.vibrant} 20%, rgba(255, 255, 255, 0.8)), inset 0 0 0 1px rgba(255, 255, 255, 0.28), inset 0 -1.5px 1px 0 rgba(0, 0, 0, 0.3)`;
		computedBorder = template.borderHighlight;
	} else if (materialId === "smoked" && artwork?.vibrant) {
		// 4. SMOKED: Restrained, dark atmospheric diffusion through deep obsidian surface
		computedTint = `color-mix(in srgb, ${artwork.vibrant} 6%, rgba(12, 14, 20, 0.78))`;
		computedSheen = `linear-gradient(180deg, color-mix(in srgb, ${artwork.vibrant} 12%, rgba(255, 255, 255, 0.2)) 0%, rgba(255, 255, 255, 0.03) 40%, transparent 100%)`;
		computedRim = template.rimSpecular;
		computedBorder = template.borderHighlight;
	} else if (theme.mode === "light" && materialId !== "smoked") {
		// In light mode fallback without artwork
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
