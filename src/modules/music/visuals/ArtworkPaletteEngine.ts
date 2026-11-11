export interface ArtworkPalette {
	dominant: string;
	vibrant: string;
	muted: string;
	secondary: string;
	glow: string;
	luminance: number;
	saturation: number;
	isDark: boolean;
	isLight: boolean;
	isMonochrome: boolean;
}

const DEFAULT_PALETTE: ArtworkPalette = {
	dominant: "rgb(139, 146, 255)",
	vibrant: "rgb(160, 164, 255)",
	muted: "rgb(100, 105, 180)",
	secondary: "rgb(120, 130, 220)",
	glow: "rgba(139, 146, 255, 0.4)",
	luminance: 0.5,
	saturation: 0.4,
	isDark: false,
	isLight: false,
	isMonochrome: false,
};

const paletteCache = new Map<string, ArtworkPalette>();

/**
 * Extracts a harmonized perceptual palette from an artwork image URL or data URL.
 */
export async function extractArtworkPalette(
	src: string | null | undefined,
	providerFallbackColor = "#8b92ff",
): Promise<ArtworkPalette> {
	if (!src) {
		return {
			...DEFAULT_PALETTE,
			dominant: providerFallbackColor,
			vibrant: providerFallbackColor,
			glow: `${providerFallbackColor}66`,
		};
	}

	const cached = paletteCache.get(src);
	if (cached) return cached;

	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = "anonymous";

		img.onload = () => {
			try {
				const palette = analyzeImage(img, providerFallbackColor);
				paletteCache.set(src, palette);
				resolve(palette);
			} catch {
				resolve(DEFAULT_PALETTE);
			}
		};

		img.onerror = () => {
			resolve(DEFAULT_PALETTE);
		};

		img.src = src;
	});
}

function analyzeImage(img: HTMLImageElement, fallbackColor: string): ArtworkPalette {
	const size = 32;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return DEFAULT_PALETTE;

	ctx.drawImage(img, 0, 0, size, size);
	const { data } = ctx.getImageData(0, 0, size, size);

	let totalR = 0;
	let totalG = 0;
	let totalB = 0;
	let maxSat = 0;
	let minSat = 1;
	let vibrantR = 0;
	let vibrantG = 0;
	let vibrantB = 0;
	let vibrantWeight = 0;
	let totalLuminance = 0;
	const pixelCount = data.length / 4;

	for (let i = 0; i < data.length; i += 4) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];

		totalR += r;
		totalG += g;
		totalB += b;

		// Relative luminance (sRGB / Rec. 709)
		const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
		totalLuminance += lum;

		// Saturation in perceptual HSL
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const sat = max === 0 ? 0 : (max - min) / max;
		maxSat = Math.max(maxSat, sat);
		minSat = Math.min(minSat, sat);

		// Weight by saturation and mid-luminance for vibrant extraction
		const lumWeight = 1 - Math.abs(lum - 0.5) * 1.5;
		const weight = Math.max(0.01, sat * sat * lumWeight);

		vibrantR += r * weight;
		vibrantG += g * weight;
		vibrantB += b * weight;
		vibrantWeight += weight;
	}

	const avgLum = totalLuminance / pixelCount;
	const avgR = Math.round(totalR / pixelCount);
	const avgG = Math.round(totalG / pixelCount);
	const avgB = Math.round(totalB / pixelCount);

	const vR = vibrantWeight > 0 ? Math.round(vibrantR / vibrantWeight) : avgR;
	const vG = vibrantWeight > 0 ? Math.round(vibrantG / vibrantWeight) : avgG;
	const vB = vibrantWeight > 0 ? Math.round(vibrantB / vibrantWeight) : avgB;

	const isDark = avgLum < 0.18;
	const isLight = avgLum > 0.82;
	const isMonochrome = maxSat < 0.12;

	// If predominantly black or monochrome, boost with provider color
	let vibrantColor = `rgb(${vR}, ${vG}, ${vB})`;
	if (isDark || isMonochrome) {
		vibrantColor = fallbackColor;
	} else if (isLight) {
		// Darken slightly for light artwork so it doesn't wash out
		vibrantColor = `rgb(${Math.round(vR * 0.75)}, ${Math.round(vG * 0.75)}, ${Math.round(vB * 0.75)})`;
	}

	const dominantColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
	const mutedColor = `rgb(${Math.round(avgR * 0.8 + 30)}, ${Math.round(avgG * 0.8 + 30)}, ${Math.round(avgB * 0.8 + 30)})`;
	const secondaryColor = `rgb(${Math.round(vR * 0.6 + avgR * 0.4)}, ${Math.round(vG * 0.6 + avgG * 0.4)}, ${Math.round(vB * 0.6 + avgB * 0.4)})`;

	return {
		dominant: dominantColor,
		vibrant: vibrantColor,
		muted: mutedColor,
		secondary: secondaryColor,
		glow: `rgba(${vR}, ${vG}, ${vB}, 0.42)`,
		luminance: avgLum,
		saturation: maxSat,
		isDark,
		isLight,
		isMonochrome,
	};
}
