import { TimerIcon } from "lucide-react";
import { useT } from "../../core/i18n";
import { moduleEnabled, useSetting } from "../../core/settings";
import type { IslandModule, ModuleView } from "../../core/types";
import { PomodoroBubble } from "./components/PomodoroBubble";
import { PomodoroPanel } from "./components/PomodoroPanel";
import { PomodoroSettings } from "./components/PomodoroSettings";
import {
	pomodoroBreakDuration,
	pomodoroLongBreakDuration,
	pomodoroRoundsBeforeLongBreak,
	pomodoroSettings,
	pomodoroWorkDuration,
} from "./settings";
import { usePomodoroTimer } from "./usePomodoroTimer";

function formatMinutesSeconds(ms: number): string {
	const totalSec = Math.max(0, Math.ceil(ms / 1000));
	const mins = Math.floor(totalSec / 60);
	const secs = String(totalSec % 60).padStart(2, "0");
	return `${mins}:${secs}`;
}

export const pomodoroModule: IslandModule = {
	id: "pomodoro",
	title: "pomodoro.title",
	settingsIcon: <TimerIcon size={15} />,
	enabledByDefault: true,
	settings: Object.values(pomodoroSettings),
	SettingsSection: PomodoroSettings,
	useView(): ModuleView {
		const t = useT();
		const enabled = useSetting(moduleEnabled(pomodoroModule));
		const workMinutes = useSetting(pomodoroWorkDuration);
		const breakMinutes = useSetting(pomodoroBreakDuration);
		const longBreakMinutes = useSetting(pomodoroLongBreakDuration);
		const roundsBeforeLong = useSetting(pomodoroRoundsBeforeLongBreak);
		const autoBreak = useSetting(pomodoroSettings.autoStartBreak);
		const autoWork = useSetting(pomodoroSettings.autoStartWork);
		const showBubble = useSetting(pomodoroSettings.showBubble);
		const soundChime = useSetting(pomodoroSettings.soundChime);

		const { timer, start, pause, reset, skip, selectPhase } = usePomodoroTimer(
			workMinutes,
			breakMinutes,
			longBreakMinutes,
			roundsBeforeLong,
			autoBreak,
			autoWork,
			soundChime,
			enabled,
		);

		const isWork = timer.phase === "work";
		const isLong = timer.phase === "longBreak";
		const accent = isWork ? "#FF6358" : isLong ? "#5E5CE6" : "#30D158";

		return {
			active: timer.running || timer.done,
			priority: timer.done ? 72 : 62,
			accent,
			icon: <TimerIcon size={15} color={accent} />,
			compact:
				timer.running || timer.done
					? {
							left: (
								<span className="flex items-center gap-1.75 text-[13px] font-[650]">
									<TimerIcon size={14} color={accent} />
									{timer.done
										? t("pomodoro.compact.done")
										: isWork
											? t("pomodoro.compact.work")
											: isLong
												? t("pomodoro.compact.longBreak")
												: t("pomodoro.compact.break")}
								</span>
							),
							right: (
								<span className="text-[12px] font-bold tabular-nums" style={{ color: accent }}>
									{timer.done ? t("pomodoro.compact.takeBreak") : formatMinutesSeconds(timer.remaining)}
								</span>
							),
							width: 275,
						}
					: undefined,
			ambient: showBubble ? <PomodoroBubble timer={timer} /> : undefined,
			expanded: (
				<PomodoroPanel
					timer={timer}
					onStart={start}
					onPause={pause}
					onReset={reset}
					onSkip={skip}
					onSelectPhase={selectPhase}
				/>
			),
			expandedSize: { width: 560, height: 165 },
			activityKey: timer.done && timer.doneAt ? `pomo-done:${timer.doneAt}` : undefined,
			attention: timer.done,
			forceExpanded: timer.done,
		};
	},
};
