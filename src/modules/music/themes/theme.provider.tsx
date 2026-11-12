import { type CSSProperties, createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { appearanceSettings, readSetting, useSettings } from "../../../core/settings";
import { resolveMaterial } from "../materials/material.resolver";
import type { ComputedMaterialProperties, GlassMaterialId } from "../materials/material.types";
import { musicSettings } from "../settings";
import { resolveMusicAppearance } from "./theme.resolver";
import type { MusicThemeId, MusicThemeTokens } from "./theme.types";

interface MusicThemeContextValue {
	tokens: MusicThemeTokens;
	cssVars: CSSProperties;
	material: ComputedMaterialProperties;
	materialId: GlassMaterialId;
}

const MusicThemeContext = createContext<MusicThemeContextValue | null>(null);

export function MusicThemeProvider({
	children,
	providerBrandColor = "#1ed760",
	providerGlowColor = "rgba(30, 215, 96, 0.45)",
	artworkVibrant,
	artworkMuted,
	isPlaying = true,
}: {
	children: ReactNode;
	providerBrandColor?: string;
	providerGlowColor?: string;
	artworkVibrant?: string;
	artworkMuted?: string;
	isPlaying?: boolean;
}) {
	const settings = useSettings();
	const themeSetting = readSetting(settings, musicSettings.theme);
	const themeId =
		(themeSetting !== "auto" ? (themeSetting as MusicThemeId) : null) ||
		(readSetting(settings, appearanceSettings.theme) as MusicThemeId) ||
		"glass-dark";

	const materialId = (readSetting(settings, musicSettings.material) as GlassMaterialId) || "liquid";

	const [systemIsDark, setSystemIsDark] = useState(() => {
		if (typeof window === "undefined" || !window.matchMedia) return true;
		return window.matchMedia("(prefers-color-scheme: dark)").matches;
	});

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, []);

	const tokens = useMemo(
		() =>
			resolveMusicAppearance({
				themeId,
				systemIsDark,
				providerBrandColor,
				providerGlowColor,
				artworkVibrant,
				artworkMuted,
				isPlaying,
			}),
		[themeId, systemIsDark, providerBrandColor, providerGlowColor, artworkVibrant, artworkMuted, isPlaying],
	);

	const material = useMemo(
		() =>
			resolveMaterial(
				materialId,
				tokens,
				artworkVibrant
					? {
							dominant: artworkVibrant,
							vibrant: artworkVibrant,
							muted: artworkMuted ?? artworkVibrant,
							secondary: artworkMuted ?? artworkVibrant,
							glow: providerGlowColor,
							luminance: 0.5,
							saturation: 0.5,
							isDark: !systemIsDark,
							isLight: systemIsDark,
							isMonochrome: false,
						}
					: null,
			),
		[materialId, tokens, artworkVibrant, artworkMuted, providerGlowColor, systemIsDark],
	);

	const cssVars = useMemo<CSSProperties>(
		() =>
			({
				"--music-bg": tokens.background,
				"--music-surface": tokens.surface,
				"--music-surface-elevated": tokens.surfaceElevated,
				"--music-text-primary": tokens.textPrimary,
				"--music-text-secondary": tokens.textSecondary,
				"--music-text-muted": tokens.textMuted,
				"--music-border": tokens.border,
				"--music-border-highlight": tokens.borderHighlight,
				"--music-specular": tokens.rimSpecular,
				"--music-sheen": tokens.sheenGradient,
				"--music-accent": tokens.accentPrimary,
				"--music-accent-secondary": tokens.accentSecondary,
				"--music-ambient-glow": tokens.ambientGlow,
				"--music-control-surface": tokens.controlSurface,
				"--music-control-hover": tokens.controlHover,
				"--music-control-active": tokens.controlActive,
				"--music-control-icon": tokens.controlIcon,
				"--music-control-icon-muted": tokens.controlIconMuted,
				"--music-progress-track": tokens.progressTrack,
				"--music-progress-fill": tokens.progressFill,
			}) as CSSProperties,
		[tokens],
	);

	const value = useMemo(() => ({ tokens, cssVars, material, materialId }), [tokens, cssVars, material, materialId]);

	return (
		<MusicThemeContext.Provider value={value}>
			<div className="contents transition-colors duration-300 ease-out" style={cssVars}>
				{children}
			</div>
		</MusicThemeContext.Provider>
	);
}

export function useMusicTheme(): MusicThemeTokens {
	const ctx = useContext(MusicThemeContext);
	if (!ctx) {
		return resolveMusicAppearance({
			themeId: "glass-dark",
			systemIsDark: true,
			providerBrandColor: "#1ed760",
			providerGlowColor: "rgba(30, 215, 96, 0.45)",
			isPlaying: true,
		});
	}
	return ctx.tokens;
}

export function useMusicMaterial(): ComputedMaterialProperties {
	const ctx = useContext(MusicThemeContext);
	if (!ctx) {
		const fallbackTokens = resolveMusicAppearance({
			themeId: "glass-dark",
			systemIsDark: true,
			providerBrandColor: "#1ed760",
			providerGlowColor: "rgba(30, 215, 96, 0.45)",
			isPlaying: true,
		});
		return resolveMaterial("liquid", fallbackTokens);
	}
	return ctx.material;
}
