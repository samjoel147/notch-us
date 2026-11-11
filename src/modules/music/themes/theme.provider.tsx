import { type CSSProperties, createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { appearanceSettings, readSetting, useSettings } from "../../../core/settings";
import { resolveMusicAppearance } from "./theme.resolver";
import type { MusicThemeId, MusicThemeTokens } from "./theme.types";

interface MusicThemeContextValue {
	tokens: MusicThemeTokens;
	cssVars: CSSProperties;
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
	const themeId = (readSetting(settings, appearanceSettings.theme) as MusicThemeId) || "glass-dark";

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

	const value = useMemo(() => ({ tokens, cssVars }), [tokens, cssVars]);

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
		// Fallback to default glass-dark if rendered outside provider
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
