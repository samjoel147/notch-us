import type { GlassMaterialId, MaterialTokens } from "./material.types";

/**
 * Concrete definitions of the five independent glass materials:
 * 1. frosted: Milky translucent, soft light diffusion, visible blur, frosted edge.
 * 2. crystal: High transparency, fine reflective borders, layered depth, sharp specular highlights.
 * 3. liquid: Fluid optical appearance, layered refraction sheen simulation, dynamic reflections.
 * 4. smoked: Dark translucent surface, subtle gradients, rim lighting, high text contrast.
 * 5. adaptive: Dynamically adjusts opacity & tint based on theme + artwork palette.
 */
export const MATERIAL_REGISTRY: Record<GlassMaterialId, MaterialTokens> = {
	frosted: {
		id: "frosted",
		name: "Frosted Glass",
		description: "Milky translucent surface with soft light diffusion and frosted edge highlights.",
		blur: "backdrop-blur-2xl",
		surfaceAlpha: 0.14,
		surfaceTint: "rgba(255, 255, 255, 0.14)",
		sheenGradient:
			"linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.08) 45%, transparent 100%)",
		rimSpecular:
			"inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.55), inset 0 0 0 1px rgba(255, 255, 255, 0.22), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.25)",
		innerGlow: "rgba(255, 255, 255, 0.08)",
		borderHighlight: "rgba(255, 255, 255, 0.25)",
		shadow: "0 20px 48px -10px rgba(0, 0, 0, 0.65), 0 4px 16px -2px rgba(0, 0, 0, 0.4)",
		supportsOpticalRefraction: false,
	},

	crystal: {
		id: "crystal",
		name: "Crystal Glass",
		description: "High transparency with razor-sharp reflective borders and layered optical clarity.",
		blur: "backdrop-blur-md",
		surfaceAlpha: 0.05,
		surfaceTint: "rgba(255, 255, 255, 0.05)",
		sheenGradient:
			"linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.04) 30%, transparent 70%)",
		rimSpecular:
			"inset 0 2px 1.5px 0 rgba(255, 255, 255, 0.85), inset 0 0 0 1px rgba(255, 255, 255, 0.32), inset 0 -1.5px 1px 0 rgba(0, 0, 0, 0.35)",
		innerGlow: "rgba(255, 255, 255, 0.18)",
		borderHighlight: "rgba(255, 255, 255, 0.45)",
		shadow: "0 24px 56px -12px rgba(0, 0, 0, 0.72), 0 6px 20px -3px rgba(0, 0, 0, 0.45)",
		supportsOpticalRefraction: true,
	},

	liquid: {
		id: "liquid",
		name: "Liquid Glass",
		description: "Fluid VisionOS optical appearance with dynamic refraction sheen and dynamic reflections.",
		blur: "backdrop-blur-xl",
		surfaceAlpha: 0.12,
		surfaceTint: "rgba(255, 255, 255, 0.10)",
		sheenGradient:
			"linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.12) 36%, rgba(255, 255, 255, 0.02) 65%, transparent 100%)",
		rimSpecular:
			"inset 0 2px 2px 0 rgba(255, 255, 255, 0.75), inset 0 0 0 1px rgba(255, 255, 255, 0.28), inset 0 -1.5px 1px 0 rgba(0, 0, 0, 0.3)",
		innerGlow: "rgba(255, 255, 255, 0.14)",
		borderHighlight: "rgba(255, 255, 255, 0.38)",
		shadow: "0 22px 52px -10px rgba(0, 0, 0, 0.7), 0 6px 18px -3px rgba(0, 0, 0, 0.4)",
		supportsOpticalRefraction: true,
	},

	smoked: {
		id: "smoked",
		name: "Smoked Glass",
		description: "Dark translucent surface with elegant rim lighting and maximum contrast for typography.",
		blur: "backdrop-blur-2xl",
		surfaceAlpha: 0.75,
		surfaceTint: "rgba(12, 14, 20, 0.75)",
		sheenGradient:
			"linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 100%)",
		rimSpecular:
			"inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.12), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.6)",
		innerGlow: "rgba(0, 0, 0, 0.35)",
		borderHighlight: "rgba(255, 255, 255, 0.16)",
		shadow: "0 28px 64px -14px rgba(0, 0, 0, 0.9), 0 8px 24px -4px rgba(0, 0, 0, 0.6)",
		supportsOpticalRefraction: false,
	},

	adaptive: {
		id: "adaptive",
		name: "Adaptive Glass",
		description: "Dynamically adapts opacity, blur, and chromatic refraction to active artwork and theme.",
		blur: "backdrop-blur-xl",
		surfaceAlpha: 0.16,
		surfaceTint: "rgba(255, 255, 255, 0.12)",
		sheenGradient:
			"linear-gradient(180deg, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.08) 40%, transparent 100%)",
		rimSpecular:
			"inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.65), inset 0 0 0 1px rgba(255, 255, 255, 0.22), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.3)",
		innerGlow: "rgba(255, 255, 255, 0.12)",
		borderHighlight: "rgba(255, 255, 255, 0.3)",
		shadow: "0 24px 54px -10px rgba(0, 0, 0, 0.72), 0 6px 18px -3px rgba(0, 0, 0, 0.42)",
		supportsOpticalRefraction: true,
	},
};
