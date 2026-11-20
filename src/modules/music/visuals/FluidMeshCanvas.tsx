import { useMemo } from "react";

export interface FluidMeshCanvasProps {
	/** Primary vibrant color extracted from artwork */
	primaryColor?: string;
	/** Secondary / complementary color extracted from artwork */
	secondaryColor?: string;
	/** Precomputed dynamic fluid mesh multi-point gradient */
	meshBackground?: string;
	/** Master opacity scalar [0.0 - 1.0] */
	opacity?: number;
	/** Optional additional CSS classes */
	className?: string;
}

/**
 * Living Fluid Mesh Canvas — Whole-Surface Dual-Tone Dynamic Artwork Splash.
 * Inspired by Apple Music's full-bleed animated canvas and Android's Material You fluid notification.
 * Renders an organic multi-stop fluid splash spanning the entire music player surface.
 * Executes smooth 900ms cubic-bezier crossfades on track changes while maintaining static stability
 * during playback to ensure zero background GPU overhead.
 */
export function FluidMeshCanvas({
	primaryColor = "#8b5cf6",
	secondaryColor = "#ec4899",
	meshBackground,
	opacity = 1,
	className = "",
}: FluidMeshCanvasProps) {
	// Fallback dynamic mesh if precomputed meshBackground is not provided
	const backgroundStyle = useMemo(() => {
		if (meshBackground) return meshBackground;

		return [
			`radial-gradient(ellipse 65% 85% at 18% 36%, color-mix(in srgb, ${primaryColor} 28%, transparent) 0%, transparent 72%)`,
			`radial-gradient(ellipse 75% 70% at 84% 68%, color-mix(in srgb, ${secondaryColor} 18%, transparent) 0%, transparent 70%)`,
			`radial-gradient(circle at 50% 100%, color-mix(in srgb, ${primaryColor} 12%, transparent) 0%, transparent 60%)`,
			`linear-gradient(135deg, color-mix(in srgb, ${primaryColor} 6%, transparent) 0%, color-mix(in srgb, ${secondaryColor} 4%, transparent) 100%)`,
		].join(", ");
	}, [meshBackground, primaryColor, secondaryColor]);

	return (
		<div
			className={`notch-music-player__fluid-canvas pointer-events-none -z-20 overflow-hidden transition-[background,opacity] duration-900 ease-[cubic-bezier(0.16,1,0.3,1)] ${className}`}
			style={{
				background: backgroundStyle,
				opacity,
			}}
			aria-hidden="true"
		>
			{/* High-fidelity fluid splash contour SVG for organic flowing shapes */}
			<svg
				className="pointer-events-none absolute inset-0 size-full opacity-45 mix-blend-screen transition-opacity duration-700"
				viewBox="0 0 560 220"
				fill="none"
				preserveAspectRatio="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<title>Fluid Mesh Canvas</title>
				<defs>
					<filter id="fluid-blur" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="36" result="blur" />
					</filter>
				</defs>
				{/* Fluid splash path originating around album thumbnail and flowing across the notch */}
				<path
					d="M-40 -40 Q 140 10 240 90 T 480 120 Q 600 160 600 240 L -40 240 Z"
					fill={primaryColor}
					opacity="0.18"
					filter="url(#fluid-blur)"
				/>
				{/* Secondary fluid splash counter-contour around right control deck */}
				<path
					d="M 300 -40 Q 440 25 520 105 T 600 150 L 600 -40 Z"
					fill={secondaryColor}
					opacity="0.16"
					filter="url(#fluid-blur)"
				/>
			</svg>
		</div>
	);
}
