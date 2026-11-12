/**
 * Five Independent Glass Materials Architecture for Notch Pop.
 * These materials are completely orthogonal to themes and can be
 * applied across all 9 visual themes.
 */

export type GlassMaterialId = "frosted" | "crystal" | "liquid" | "smoked" | "adaptive";

export interface MaterialTokens {
	id: GlassMaterialId;
	name: string;
	description: string;
	blur: string; // Tailwind blur class or CSS backdrop-filter
	surfaceAlpha: number; // Base opacity of surface
	surfaceTint: string; // Base color or rgba
	sheenGradient: string; // Optical light reflection sheen
	rimSpecular: string; // Edge specular highlight reflection
	innerGlow: string; // Inner ambient refraction
	borderHighlight: string; // Border accent
	shadow: string; // Depth shadow
	supportsOpticalRefraction: boolean;
}

export interface ComputedMaterialProperties {
	style: React.CSSProperties;
	className: string;
}
