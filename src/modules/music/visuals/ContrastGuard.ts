export interface ContrastSafeColors {
	textPrimary: string;
	textSecondary: string;
	textMuted: string;
	surfaceBorder: string;
	controlBackground: string;
	controlHover: string;
	glowOpacity: number;
}

export function computeContrastSafeColors(isLight: boolean, isGlass: boolean): ContrastSafeColors {
	if (isLight) {
		return {
			textPrimary: "#141417",
			textSecondary: "rgba(20, 20, 23, 0.72)",
			textMuted: "rgba(20, 20, 23, 0.45)",
			surfaceBorder: isGlass ? "rgba(0, 0, 0, 0.10)" : "rgba(0, 0, 0, 0.12)",
			controlBackground: "rgba(0, 0, 0, 0.06)",
			controlHover: "rgba(0, 0, 0, 0.12)",
			glowOpacity: 0.14,
		};
	}

	return {
		textPrimary: "#ffffff",
		textSecondary: "rgba(255, 255, 255, 0.70)",
		textMuted: "rgba(255, 255, 255, 0.42)",
		surfaceBorder: isGlass ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.10)",
		controlBackground: "rgba(255, 255, 255, 0.10)",
		controlHover: "rgba(255, 255, 255, 0.18)",
		glowOpacity: 0.38,
	};
}
