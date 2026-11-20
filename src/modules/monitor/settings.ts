import type { SettingDef } from "../../core/settings";

/** Also read by the backend (`src-tauri/src/providers/monitor/mod.rs`). */
export const systemMonitorSettings = {
	alerts: {
		key: "monitor.alerts",
		label: "monitor.alerts.label",
		description: "monitor.alerts.desc",
		default: true,
	},
	showBubble: {
		key: "monitor.showBubble",
		label: "monitor.showBubble.label",
		description: "monitor.showBubble.desc",
		default: false,
	},
	cpuThreshold: {
		key: "monitor.cpuThreshold",
		label: "monitor.cpuThreshold.label",
		description: "monitor.cpuThreshold.desc",
		default: 90,
	},
	ramThreshold: {
		key: "monitor.ramThreshold",
		label: "monitor.ramThreshold.label",
		description: "monitor.ramThreshold.desc",
		default: 90,
	},
	pollRate: {
		key: "monitor.pollRate",
		label: "monitor.pollRate.label",
		description: "monitor.pollRate.desc",
		default: 2,
	},
} as const satisfies Record<string, SettingDef<boolean | number>>;

export const systemMonitorToggleSettings: SettingDef<boolean>[] = [
	systemMonitorSettings.alerts,
	systemMonitorSettings.showBubble,
];
