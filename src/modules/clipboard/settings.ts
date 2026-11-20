import type { SettingDef } from "../../core/settings";

export const clipboardSettings = {
	showOnCopy: {
		key: "clipboard.showOnCopy",
		label: "clipboard.showOnCopy.label",
		description: "clipboard.showOnCopy.desc",
		default: true,
	},
	peekOnScreenshot: {
		key: "clipboard.peekOnScreenshot",
		label: "clipboard.peekOnScreenshot.label",
		description: "clipboard.peekOnScreenshot.desc",
		default: true,
	},
	maskSecrets: {
		key: "clipboard.maskSecrets",
		label: "clipboard.maskSecrets.label",
		description: "clipboard.maskSecrets.desc",
		default: true,
	},
	captureColors: {
		key: "clipboard.captureColors",
		label: "clipboard.captureColors.label",
		description: "clipboard.captureColors.desc",
		default: true,
	},
	historyLimit: {
		key: "clipboard.historyLimit",
		label: "clipboard.historyLimit.label",
		description: "clipboard.historyLimit.desc",
		default: 50,
	},
	clearOnQuit: {
		key: "clipboard.clearOnQuit",
		label: "clipboard.clearOnQuit.label",
		description: "clipboard.clearOnQuit.desc",
		default: false,
	},
} as const satisfies Record<string, SettingDef<boolean | number>>;

export const clipboardToggleSettings: SettingDef<boolean>[] = [
	clipboardSettings.showOnCopy,
	clipboardSettings.peekOnScreenshot,
	clipboardSettings.maskSecrets,
	clipboardSettings.captureColors,
	clipboardSettings.clearOnQuit,
];
