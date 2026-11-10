import type { SettingDef } from "../../core/settings";

export const pomodoroSettings = {
	autoStartBreak: {
		key: "pomodoro.autoStartBreak",
		label: "pomodoro.autoStartBreak.label",
		description: "pomodoro.autoStartBreak.desc",
		default: false,
	},
	autoStartWork: {
		key: "pomodoro.autoStartWork",
		label: "pomodoro.autoStartWork.label",
		description: "pomodoro.autoStartWork.desc",
		default: false,
	},
	showBubble: {
		key: "pomodoro.showBubble",
		label: "pomodoro.showBubble.label",
		description: "pomodoro.showBubble.desc",
		default: true,
	},
	soundChime: {
		key: "pomodoro.soundChime",
		label: "pomodoro.soundChime.label",
		description: "pomodoro.soundChime.desc",
		default: true,
	},
} satisfies Record<string, SettingDef>;

export const pomodoroWorkDuration: SettingDef<number> = {
	key: "pomodoro.workMinutes",
	label: "pomodoro.workDuration.label",
	description: "pomodoro.workDuration.desc",
	default: 25,
};

export const pomodoroBreakDuration: SettingDef<number> = {
	key: "pomodoro.breakMinutes",
	label: "pomodoro.breakDuration.label",
	description: "pomodoro.breakDuration.desc",
	default: 5,
};

export const pomodoroLongBreakDuration: SettingDef<number> = {
	key: "pomodoro.longBreakMinutes",
	label: "pomodoro.longBreakDuration.label",
	description: "pomodoro.longBreakDuration.desc",
	default: 15,
};

export const pomodoroRoundsBeforeLongBreak: SettingDef<number> = {
	key: "pomodoro.roundsBeforeLongBreak",
	label: "pomodoro.roundsBeforeLongBreak.label",
	description: "pomodoro.roundsBeforeLongBreak.desc",
	default: 4,
};

