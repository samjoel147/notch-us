import type { ReactNode } from "react";
import { Row } from "../../components/ui/card";
import { Segmented } from "../../components/ui/form";
import type { SettingDef } from "../../core/settings";
import { setSetting } from "../../core/settings";

interface SegmentedRowProps<T extends string | number> {
	def: SettingDef<T>;
	value: T;
	options: { value: T; label: string }[];
	label?: ReactNode;
	desc?: ReactNode;
	disabled?: boolean;
}

export function SegmentedRow<T extends string | number>({
	def,
	value,
	options,
	label,
	desc,
	disabled = false,
}: SegmentedRowProps<T>) {
	const current = value ?? def.default;

	return (
		<Row as="div" label={label ?? def.label} desc={desc ?? def.description} disabled={disabled}>
			<Segmented options={options} value={current} disabled={disabled} onChange={(val) => setSetting(def, val)} />
		</Row>
	);
}
