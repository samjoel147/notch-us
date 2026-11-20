import type { ReactNode } from "react";
import { Row } from "../../components/ui/card";
import { cn } from "../../core/cn";
import type { SettingDef } from "../../core/settings";
import { setSetting } from "../../core/settings";

interface SliderRowProps {
	def: SettingDef<number>;
	value: number;
	min: number;
	max: number;
	step?: number;
	unit?: string;
	label?: ReactNode;
	desc?: ReactNode;
	disabled?: boolean;
}

export function SliderRow({
	def,
	value,
	min,
	max,
	step = 1,
	unit = "",
	label,
	desc,
	disabled = false,
}: SliderRowProps) {
	const current = value ?? def.default;

	return (
		<Row as="div" label={label ?? def.label} desc={desc ?? def.description} disabled={disabled}>
			<div className="flex items-center gap-3 w-56 flex-none">
				<input
					type="range"
					min={min}
					max={max}
					step={step}
					value={current}
					disabled={disabled}
					onChange={(e) => setSetting(def, Number(e.target.value))}
					className={cn(
						"h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--accent,#38bdf8)] transition-all",
						disabled && "opacity-40 cursor-not-allowed",
					)}
				/>
				<span className="w-12 text-right font-mono text-[12.5px] font-bold tabular-nums text-text">
					{current}
					{unit}
				</span>
			</div>
		</Row>
	);
}
