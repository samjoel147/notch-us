import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../core/cn";

/** Single-line text that scrolls back and forth when it doesn't fit. */
export function Marquee({ text, className, style }: { text: string; className?: string; style?: CSSProperties }) {
	const outer = useRef<HTMLDivElement>(null);
	const inner = useRef<HTMLSpanElement>(null);
	const [overflow, setOverflow] = useState(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the text changes
	useLayoutEffect(() => {
		const measure = () => {
			if (!outer.current || !inner.current) return;
			setOverflow(Math.max(0, inner.current.scrollWidth - outer.current.clientWidth));
		};
		measure();
		const ro = new ResizeObserver(measure);
		if (outer.current) ro.observe(outer.current);
		return () => ro.disconnect();
	}, [text]);

	return (
		<div
			ref={outer}
			style={style}
			className={cn(
				"overflow-hidden whitespace-nowrap py-0.5",
				overflow && "[mask-image:linear-gradient(90deg,#000_0,#000_calc(100%-14px),transparent)]",
				className,
			)}
		>
			<span
				ref={inner}
				className={cn("inline-block", overflow && "animate-marquee px-3")}
				style={
					overflow
						? ({
								"--marquee-distance": `-${overflow}px`,
								"--marquee-duration": `${Math.max(6, overflow / 18)}s`,
							} as React.CSSProperties)
						: undefined
				}
			>
				{text}
			</span>
		</div>
	);
}
