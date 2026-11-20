export interface ArtworkPalette {
	dominant: string;
	vibrant: string;
	muted: string;
	secondary: string;
	complementary: string;
	backgroundCompatible: string;
	glow: string;
	luminance: number;
	saturation: number;
	isDark: boolean;
	isLight: boolean;
	isMonochrome: boolean;
}

const DEFAULT_PALETTE: ArtworkPalette = {
	dominant: "rgb(200, 205, 220)",
	vibrant: "rgb(215, 220, 235)",
	muted: "rgb(120, 125, 140)",
	secondary: "rgb(150, 155, 170)",
	complementary: "rgb(180, 190, 210)",
	backgroundCompatible: "rgba(200, 205, 220, 0.12)",
	glow: "rgba(215, 220, 235, 0.35)",
	luminance: 0.5,
	saturation: 0.2,
	isDark: false,
	isLight: false,
	isMonochrome: true,
};

const paletteCache = new Map<string, ArtworkPalette>();

/**
 * Extracts a harmonized perceptual palette from an artwork image URL or data URL.
 */
export async function extractArtworkPalette(
	src: string | null | undefined,
	providerFallbackColor = "rgb(215, 220, 235)",
): Promise<ArtworkPalette> {
	if (!src) {
		return {
			...DEFAULT_PALETTE,
			dominant: providerFallbackColor,
			vibrant: providerFallbackColor,
			secondary: providerFallbackColor,
			complementary: providerFallbackColor,
			backgroundCompatible: `${providerFallbackColor}18`,
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

interface ColorBucket {
	count: number;
	sumR: number;
	sumG: number;
	sumB: number;
	r: number;
	g: number;
	b: number;
	sat: number;
	lum: number;
	score: number;
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
	// Redmean color distance for perceptual color separation
	const rmean = (r1 + r2) / 2;
	const dr = r1 - r2;
	const dg = g1 - g2;
	const db = b1 - b2;
	return Math.sqrt((((512 + rmean) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rmean) * db * db) >> 8));
}

function analyzeImage(img: HTMLImageElement, fallbackColor: string): ArtworkPalette {
	const size = 48; // 2,304 sample pixels for high-fidelity clustering
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return DEFAULT_PALETTE;

	ctx.drawImage(img, 0, 0, size, size);
	const { data } = ctx.getImageData(0, 0, size, size);

	let totalR = 0;
	let totalG = 0;
	let totalB = 0;
	let totalLuminance = 0;
	let maxSat = 0;
	const pixelCount = data.length / 4;

	// 5-bit color buckets (32 x 32 x 32)
	const buckets = new Map<number, ColorBucket>();

	for (let i = 0; i < data.length; i += 4) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];

		totalR += r;
		totalG += g;
		totalB += b;

		// Perceptual relative luminance (sRGB / Rec. 709)
		const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
		totalLuminance += lum;

		// Perceptual saturation
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const sat = max === 0 ? 0 : (max - min) / max;
		if (sat > maxSat) maxSat = sat;

		// Skip extreme black (< 5%) or blinding specular glare (> 95%) for bucket analysis
		if (lum < 0.05 || lum > 0.95) continue;

		// Quantize into 5-bit key
		const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
		let bucket = buckets.get(key);
		if (!bucket) {
			bucket = { count: 0, sumR: 0, sumG: 0, sumB: 0, r: 0, g: 0, b: 0, sat: 0, lum: 0, score: 0 };
			buckets.set(key, bucket);
		}
		bucket.count++;
		bucket.sumR += r;
		bucket.sumG += g;
		bucket.sumB += b;
	}

	const avgLum = totalLuminance / pixelCount;
	const avgR = Math.round(totalR / pixelCount);
	const avgG = Math.round(totalG / pixelCount);
	const avgB = Math.round(totalB / pixelCount);
	const isMonochrome = maxSat < 0.12;

	// Process and score all populated buckets
	const candidates: ColorBucket[] = [];
	for (const bucket of buckets.values()) {
		bucket.r = Math.round(bucket.sumR / bucket.count);
		bucket.g = Math.round(bucket.sumG / bucket.count);
		bucket.b = Math.round(bucket.sumB / bucket.count);

		const max = Math.max(bucket.r, bucket.g, bucket.b);
		const min = Math.min(bucket.r, bucket.g, bucket.b);
		bucket.sat = max === 0 ? 0 : (max - min) / max;
		bucket.lum = (0.2126 * bucket.r + 0.7152 * bucket.g + 0.0722 * bucket.b) / 255;

		// Score prioritizes rich, well-saturated mid-luminance colors
		const lumWeight = 1 - Math.abs(bucket.lum - 0.5) * 1.3;
		bucket.score = bucket.count * bucket.sat ** 1.4 * Math.max(0.1, lumWeight);

		if (bucket.sat > 0.15) {
			candidates.push(bucket);
		}
	}

	// Sort candidates by perceptual vibrancy score descending
	candidates.sort((a, b) => b.score - a.score);

	// Primary vibrant color: top-scoring cluster
	let pR = avgR;
	let pG = avgG;
	let pB = avgB;

	if (candidates.length > 0) {
		pR = candidates[0].r;
		pG = candidates[0].g;
		pB = candidates[0].b;
	}

	// Secondary distinct color: find the next highest cluster with genuine color separation (ΔE >= 65)
	let sR = pR;
	let sG = pG;
	let sB = pB;
	let foundDistinctSecondary = false;

	for (let i = 1; i < candidates.length; i++) {
		const c = candidates[i];
		const dist = colorDistance(pR, pG, pB, c.r, c.g, c.b);
		if (dist >= 65) {
			sR = c.r;
			sG = c.g;
			sB = c.b;
			foundDistinctSecondary = true;
			break;
		}
	}

	// If no distinct second cluster found, derive a harmonic split (golden ratio hue shift or luminance lift)
	if (!foundDistinctSecondary) {
		if (isMonochrome) {
			sR = Math.min(255, Math.round(pR * 1.25 + 20));
			sG = Math.min(255, Math.round(pG * 1.25 + 20));
			sB = Math.min(255, Math.round(pB * 1.25 + 20));
		} else {
			// Perceptual harmonic hue offset
			sR = Math.round(pR * 0.7 + pG * 0.3);
			sG = Math.round(pG * 0.7 + pB * 0.3);
			sB = Math.round(pB * 0.7 + pR * 0.3);
		}
	}

	// Tertiary accent: find third distinct cluster
	let tR = pR;
	let tG = pG;
	let tB = pB;
	for (let i = 1; i < candidates.length; i++) {
		const c = candidates[i];
		const distP = colorDistance(pR, pG, pB, c.r, c.g, c.b);
		const distS = colorDistance(sR, sG, sB, c.r, c.g, c.b);
		if (distP >= 50 && distS >= 50) {
			tR = c.r;
			tG = c.g;
			tB = c.b;
			break;
		}
	}

	// Fallback handling for pure monochrome / slate
	let vibrantColor = `rgb(${pR}, ${pG}, ${pB})`;
	let secondaryColor = `rgb(${sR}, ${sG}, ${sB})`;
	let complementaryColor = `rgb(${tR}, ${tG}, ${tB})`;

	if (isMonochrome) {
		const mono = fallbackColor && fallbackColor !== "rgb(215, 220, 235)" ? fallbackColor : "rgb(215, 220, 235)";
		vibrantColor = mono;
		secondaryColor = mono;
		complementaryColor = mono;
	}

	const dominantColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
	const mutedColor = `rgb(${Math.round(avgR * 0.85 + 20)}, ${Math.round(avgG * 0.85 + 20)}, ${Math.round(avgB * 0.85 + 20)})`;
	const backgroundCompatible = `rgba(${avgR}, ${avgG}, ${avgB}, 0.16)`;

	return {
		dominant: dominantColor,
		vibrant: vibrantColor,
		muted: mutedColor,
		secondary: secondaryColor,
		complementary: complementaryColor,
		backgroundCompatible,
		glow: isMonochrome ? "rgba(215, 220, 235, 0.25)" : `rgba(${pR}, ${pG}, ${pB}, 0.35)`,
		luminance: avgLum,
		saturation: maxSat,
		isDark: avgLum < 0.18,
		isLight: avgLum > 0.82,
		isMonochrome,
	};
}
