/**
 * Color math and contrast guard utilities for perceptual harmony.
 */

export interface RgbColor {
	r: number;
	g: number;
	b: number;
}

export function parseHexOrRgb(color: string): RgbColor {
	if (color.startsWith("#")) {
		const hex = color.replace("#", "");
		if (hex.length === 3) {
			return {
				r: Number.parseInt(hex[0] + hex[0], 16),
				g: Number.parseInt(hex[1] + hex[1], 16),
				b: Number.parseInt(hex[2] + hex[2], 16),
			};
		}
		if (hex.length >= 6) {
			return {
				r: Number.parseInt(hex.slice(0, 2), 16),
				g: Number.parseInt(hex.slice(2, 4), 16),
				b: Number.parseInt(hex.slice(4, 6), 16),
			};
		}
	}

	const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
	if (rgbMatch) {
		return {
			r: Number.parseInt(rgbMatch[1], 10),
			g: Number.parseInt(rgbMatch[2], 10),
			b: Number.parseInt(rgbMatch[3], 10),
		};
	}

	return { r: 139, g: 146, b: 255 };
}

export function relativeLuminance({ r, g, b }: RgbColor): number {
	const a = [r, g, b].map((v) => {
		const s = v / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function contrastRatio(c1: string, c2: string): number {
	const lum1 = relativeLuminance(parseHexOrRgb(c1));
	const lum2 = relativeLuminance(parseHexOrRgb(c2));
	const brightest = Math.max(lum1, lum2);
	const darkest = Math.min(lum1, lum2);
	return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Blend two colors with a ratio (0 = base, 1 = overlay).
 */
export function blendColors(base: string, overlay: string, ratio: number): string {
	const b = parseHexOrRgb(base);
	const o = parseHexOrRgb(overlay);
	const clamped = Math.min(1, Math.max(0, ratio));

	const r = Math.round(b.r + (o.r - b.r) * clamped);
	const g = Math.round(b.g + (o.g - b.g) * clamped);
	const bl = Math.round(b.b + (o.b - b.b) * clamped);

	return `rgb(${r}, ${g}, ${bl})`;
}
