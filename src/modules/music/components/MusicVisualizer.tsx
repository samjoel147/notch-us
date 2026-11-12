import { useEffect, useRef } from "react";
import { useTauriEvent } from "../../../core/bridge";
import { useSetting } from "../../../core/settings";
import { LEVEL_EVENT } from "../hooks/useMusic";
import { musicSettings } from "../settings";
import { useMusicTheme } from "../themes/theme.provider";

const WEIGHTS = [0.65, 0.95, 1, 0.8, 0.55];
const FLOOR = 0.08;

interface MusicVisualizerProps {
	playing: boolean;
	color?: string;
	height?: number;
	barWidth?: number;
	className?: string;
}

export function MusicVisualizer({ playing, color, height = 24, barWidth = 4, className }: MusicVisualizerProps) {
	const theme = useMusicTheme();
	const visualizerStyle = useSetting(musicSettings.visualizerStyle) || "bars";
	const barColor = color || theme.accentPrimary;

	const bars = useRef<(HTMLSpanElement | null)[]>([]);
	const rawLevel = useRef(0);
	const lastLevelTime = useRef(0);

	useTauriEvent<number>(LEVEL_EVENT, (level) => {
		rawLevel.current = level;
		lastLevelTime.current = Date.now();
	});

	useEffect(() => {
		let raf = 0;
		let t = 0;
		let peak = 0.05;
		let avg = 0;
		const current = WEIGHTS.map(() => FLOOR);

		const loop = () => {
			raf = requestAnimationFrame(loop);
			t += 1;

			// Mode A: actual audio level from SMTC/Windows
			const hasActiveLevel = Date.now() - lastLevelTime.current < 250;
			let energy = 0;

			if (playing) {
				if (hasActiveLevel && rawLevel.current > 0.005) {
					const level = rawLevel.current;
					peak = Math.max(level, peak * 0.995, 0.02);
					avg += (level - avg) * 0.05;
					const norm = level / peak;
					const punch = Math.max(0, (level - avg) / peak) * 2.2;
					energy = Math.min(1, norm * 0.55 + punch);
				} else {
					// Mode B: Decorative rhythmic oscillation
					energy = 0.35 + 0.25 * Math.sin(t * 0.12) + 0.15 * Math.cos(t * 0.08);
				}
			}

			current.forEach((v, i) => {
				let goal: number;
				if (visualizerStyle === "wave") {
					// Continuous harmonic wave
					const wave = 0.5 + 0.5 * Math.sin(t * 0.14 + i * 0.9);
					goal = Math.max(FLOOR, energy * wave);
				} else if (visualizerStyle === "pulse") {
					// Symmetrical pulse from center (index 2 is center)
					const dist = Math.abs(2 - i);
					const pulse = 0.6 + 0.4 * Math.sin(t * 0.16 - dist * 0.5);
					goal = Math.max(FLOOR, energy * pulse);
				} else if (visualizerStyle === "minimal") {
					// Minimal dots
					const minPulse = 0.4 + 0.6 * Math.sin(t * 0.1 + i * 1.2);
					goal = Math.max(0.2, energy * minPulse);
				} else {
					// Classic bars
					const wobble = 0.75 + 0.25 * Math.sin(t / (4 + i * 1.2) + i * 1.8);
					goal = Math.max(FLOOR, energy * WEIGHTS[i] * wobble);
				}

				const k = goal > v ? 0.45 : 0.12;
				current[i] = v + (goal - v) * k;

				const el = bars.current[i];
				if (el) {
					if (visualizerStyle === "minimal") {
						el.style.transform = `scale(${Math.max(0.4, current[i])})`;
						el.style.opacity = `${Math.min(1, Math.max(0.3, current[i]))}`;
					} else {
						el.style.transform = `scaleY(${Math.max(0.1, current[i])})`;
						el.style.opacity = "1";
					}
				}
			});
		};

		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [playing, visualizerStyle]);

	if (visualizerStyle === "minimal") {
		return (
			<div
				className={`flex items-center justify-center gap-1.5 ${className ?? ""}`}
				style={{ height }}
				aria-hidden="true"
			>
				{[0, 1, 2].map((i) => (
					<span
						key={i}
						ref={(el) => {
							bars.current[i] = el;
						}}
						className="size-1.5 rounded-full transition-colors duration-300"
						style={{ backgroundColor: barColor }}
					/>
				))}
			</div>
		);
	}

	return (
		<div className={`flex items-end justify-center gap-1 ${className ?? ""}`} style={{ height }} aria-hidden="true">
			{WEIGHTS.map((_, i) => (
				<span
					// biome-ignore lint/suspicious/noArrayIndexKey: fixed 5-bar visualizer
					key={i}
					ref={(el) => {
						bars.current[i] = el;
					}}
					className="origin-bottom rounded-full transition-colors duration-300"
					style={{
						width: barWidth,
						height: "100%",
						backgroundColor: barColor,
					}}
				/>
			))}
		</div>
	);
}
