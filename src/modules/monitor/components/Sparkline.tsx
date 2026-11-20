import { useId } from "react";

const POINTS = 60;

interface Point {
	x: number;
	y: number;
}

/**
 * Converts a sequence of 2D points into a smooth Catmull-Rom cubic Bezier SVG path.
 */
function pointsToSplinePath(pts: Point[], h: number): string {
	if (pts.length === 0) return "";
	if (pts.length === 1) return `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;

	let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
	const n = pts.length;

	for (let i = 0; i < n - 1; i++) {
		const p0 = pts[Math.max(i - 1, 0)];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[Math.min(i + 2, n - 1)];

		const cp1x = p1.x + (p2.x - p0.x) / 6;
		const cp1y = Math.min(Math.max(p1.y + (p2.y - p0.y) / 6, 2), h);

		const cp2x = p2.x - (p3.x - p1.x) / 6;
		const cp2y = Math.min(Math.max(p2.y - (p3.y - p1.y) / 6, 2), h);

		d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
	}

	return d;
}

/**
 * The last minute as an organic, fluid Catmull-Rom spline curve with a luminous feather gradient
 * and live active telemetry endpoint dot.
 */
export function Sparkline({ values, color, max }: { values: number[]; color: string; max?: number }) {
	const id = useId();
	const w = 120;
	const h = 34;
	const top = max ?? Math.max(1, ...values) * 1.15;
	const offset = POINTS - values.length;
	const pts: Point[] = values.map((v, i) => {
		const x = ((offset + i) / (POINTS - 1)) * w;
		const y = h - (Math.min(Math.max(v, 0), top) / top) * (h - 8) - 4;
		return { x, y };
	});

	if (pts.length < 2) {
		return (
			<svg
				className="mt-auto block h-9 w-full overflow-visible"
				viewBox={`0 0 ${w} ${h}`}
				preserveAspectRatio="none"
				aria-hidden
			/>
		);
	}

	const splineD = pointsToSplinePath(pts, h);
	const first = pts[0];
	const last = pts[pts.length - 1];
	const areaD = `${splineD} L ${last.x.toFixed(1)},${h} L ${first.x.toFixed(1)},${h} Z`;

	return (
		<svg
			className="mt-auto block h-9 w-full overflow-visible"
			viewBox={`0 0 ${w} ${h}`}
			preserveAspectRatio="none"
			aria-hidden
		>
			<defs>
				<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={color} stopOpacity="0.32" />
					<stop offset="65%" stopColor={color} stopOpacity="0.08" />
					<stop offset="100%" stopColor={color} stopOpacity="0" />
				</linearGradient>
				<filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
					<feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor={color} floodOpacity="0.35" />
				</filter>
			</defs>
			<path d={areaD} fill={`url(#${id})`} />
			<path
				d={splineD}
				fill="none"
				stroke={color}
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
				filter={`url(#glow-${id})`}
				vectorEffect="non-scaling-stroke"
			/>
			{/* Live pulsing telemetry endpoint indicator */}
			<g>
				<circle cx={last.x} cy={last.y} r="2" fill={color} />
				<circle cx={last.x} cy={last.y} r="4.5" fill={color} opacity="0.25" />
			</g>
		</svg>
	);
}
