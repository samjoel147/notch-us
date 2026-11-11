export type ThemeMode = "light" | "dark";

export type MusicThemeId =
	| "glass-dark"
	| "glass-light"
	| "dark"
	| "light"
	| "cyberpunk"
	| "midnight"
	| "sunset"
	| "aurora"
	| "auto";

export interface MusicThemeTokens {
	id: MusicThemeId;
	mode: ThemeMode;
	isGlass: boolean;

	// Surfaces & Backgrounds
	background: string;
	backgroundSecondary: string;
	surface: string;
	surfaceElevated: string;
	surfaceControl: string;

	// Typography
	textPrimary: string;
	textSecondary: string;
	textMuted: string;

	// Borders & Highlights
	border: string;
	borderHighlight: string;
	rimSpecular: string;
	sheenGradient: string;

	// Accents & Atmosphere
	accentPrimary: string;
	accentSecondary: string;
	ambientGlow: string;
	ambientGlowSecondary: string;
	artworkShadow: string;

	// Interactive Controls
	progressTrack: string;
	progressFill: string;
	controlSurface: string;
	controlHover: string;
	controlActive: string;
	controlIcon: string;
	controlIconMuted: string;

	// Secondary Elements
	tooltipBackground: string;
	tooltipText: string;
	blur: string;
	cardShadow: string;
}

export interface ThemeCompositionContext {
	themeId: MusicThemeId;
	systemIsDark: boolean;
	providerBrandColor: string;
	providerGlowColor: string;
	artworkVibrant?: string;
	artworkMuted?: string;
	isPlaying: boolean;
}
