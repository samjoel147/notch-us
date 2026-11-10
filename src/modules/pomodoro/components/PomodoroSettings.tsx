import { useEffect, useState } from "react";
import { Divider, Row } from "../../../components/ui/card";
import { NumberField, Select } from "../../../components/ui/form";
import { useT } from "../../../core/i18n";
import { setSetting, useSetting } from "../../../core/settings";
import {
	pomodoroBreakDuration,
	pomodoroLongBreakDuration,
	pomodoroRoundsBeforeLongBreak,
	pomodoroWorkDuration,
} from "../settings";

const WORK_OPTIONS = [15, 20, 25, 30, 45, 50, 60];
const BREAK_OPTIONS = [3, 5, 10, 15];
const LONG_BREAK_OPTIONS = [10, 15, 20, 30];
const ROUNDS_OPTIONS = [2, 3, 4, 5, 6];
const CUSTOM = "custom";
const MAX_MINUTES = 360;

export function PomodoroSettings() {
	const t = useT();
	const work = useSetting(pomodoroWorkDuration);
	const shortBreak = useSetting(pomodoroBreakDuration);
	const longBreak = useSetting(pomodoroLongBreakDuration);
	const rounds = useSetting(pomodoroRoundsBeforeLongBreak);

	return (
		<>
			<DurationRow
				label={t("pomodoro.workDuration.label")}
				description={t("pomodoro.workDuration.desc")}
				value={work}
				options={WORK_OPTIONS}
				unit="min"
				onChange={(val) => setSetting(pomodoroWorkDuration, val)}
			/>
			<Divider />
			<DurationRow
				label={t("pomodoro.breakDuration.label")}
				description={t("pomodoro.breakDuration.desc")}
				value={shortBreak}
				options={BREAK_OPTIONS}
				unit="min"
				onChange={(val) => setSetting(pomodoroBreakDuration, val)}
			/>
			<Divider />
			<DurationRow
				label={t("pomodoro.longBreakDuration.label")}
				description={t("pomodoro.longBreakDuration.desc")}
				value={longBreak}
				options={LONG_BREAK_OPTIONS}
				unit="min"
				onChange={(val) => setSetting(pomodoroLongBreakDuration, val)}
			/>
			<Divider />
			<DurationRow
				label={t("pomodoro.roundsBeforeLongBreak.label")}
				description={t("pomodoro.roundsBeforeLongBreak.desc")}
				value={rounds}
				options={ROUNDS_OPTIONS}
				unit=""
				onChange={(val) => setSetting(pomodoroRoundsBeforeLongBreak, val)}
			/>
		</>
	);
}

function DurationRow({
	label,
	description,
	value,
	options,
	unit,
	onChange,
}: {
	label: string;
	description: string;
	value: number;
	options: number[];
	unit: string;
	onChange: (value: number) => void;
}) {
	const t = useT();
	const [custom, setCustom] = useState(!options.includes(value));
	const [draft, setDraft] = useState(String(value));

	useEffect(() => setDraft(String(value)), [value]);

	const commit = () => {
		const n = Math.round(Number(draft));
		if (Number.isFinite(n) && n >= 1 && n <= MAX_MINUTES) onChange(n);
		else setDraft(String(value));
	};

	return (
		<Row label={label} desc={description}>
			<span className="flex flex-none items-center gap-2">
				{custom && (
					<NumberField
						unit={unit}
						min={1}
						max={MAX_MINUTES}
						step={1}
						value={draft}
						aria-label={label}
						onChange={(e) => setDraft(e.target.value)}
						onBlur={commit}
						onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
					/>
				)}
				<Select
					value={custom ? CUSTOM : value}
					aria-label={label}
					onChange={(e) => {
						if (e.target.value === CUSTOM) return setCustom(true);
						setCustom(false);
						onChange(Number(e.target.value));
					}}
				>
					{options.map((opt) => (
						<option key={opt} value={opt}>
							{unit === "min" ? t("pomodoro.minutes", { n: opt }) : opt}
						</option>
					))}
					<option value={CUSTOM}>{t("pomodoro.custom")}</option>
				</Select>
			</span>
		</Row>
	);
}
