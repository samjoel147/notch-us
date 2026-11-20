import type { SettingDef } from "../../core/settings";

/** Granular toggles for each pop notification alert and system watcher. */
export const activitySettings = {
	charging: {
		key: "activities.alert.charging",
		label: "activities.alert.charging.label",
		description: "activities.alert.charging.desc",
		default: true,
	},
	lowBattery: {
		key: "activities.alert.lowBattery",
		label: "activities.alert.lowBattery.label",
		description: "activities.alert.lowBattery.desc",
		default: true,
	},
	powerSaver: {
		key: "activities.alert.powerSaver",
		label: "activities.alert.powerSaver.label",
		description: "activities.alert.powerSaver.desc",
		default: true,
	},
	volume: {
		key: "activities.alert.volume",
		label: "activities.alert.volume.label",
		description: "activities.alert.volume.desc",
		default: true,
	},
	brightness: {
		key: "activities.alert.brightness",
		label: "activities.alert.brightness.label",
		description: "activities.alert.brightness.desc",
		default: true,
	},
	capsLock: {
		key: "activities.alert.capsLock",
		label: "activities.alert.capsLock.label",
		description: "activities.alert.capsLock.desc",
		default: true,
	},
	numLock: {
		key: "activities.alert.numLock",
		label: "activities.alert.numLock.label",
		description: "activities.alert.numLock.desc",
		default: true,
	},
	wifi: {
		key: "activities.alert.wifi",
		label: "activities.alert.wifi.label",
		description: "activities.alert.wifi.desc",
		default: true,
	},
	airplane: {
		key: "activities.alert.airplane",
		label: "activities.alert.airplane.label",
		description: "activities.alert.airplane.desc",
		default: true,
	},
	resource: {
		key: "activities.alert.resource",
		label: "activities.alert.resource.label",
		description: "activities.alert.resource.desc",
		default: true,
	},
	bluetooth: {
		key: "activities.alert.bluetooth",
		label: "activities.alert.bluetooth.label",
		description: "activities.alert.bluetooth.desc",
		default: true,
	},
	privacy: {
		key: "activities.alert.privacy",
		label: "activities.alert.privacy.label",
		description: "activities.alert.privacy.desc",
		default: true,
	},
	battery: {
		key: "activities.battery",
		label: "activities.battery.label",
		description: "activities.battery.desc",
		default: true,
	},
	api: {
		key: "activities.api",
		label: "activities.api.label",
		description: "activities.api.desc",
		default: true,
	},
	duration: {
		key: "activities.alert.duration",
		label: "activities.duration.label",
		description: "activities.duration.desc",
		default: 3,
	},
} satisfies Record<string, SettingDef<boolean | number>>;

/** Activity `source` → the fallback setting that shows it. */
export const SOURCE_SETTING: Record<string, SettingDef> = {
	volume: activitySettings.volume,
	battery: activitySettings.battery,
	bluetooth: activitySettings.bluetooth,
	privacy: activitySettings.privacy,
	keyboard: activitySettings.capsLock,
	network: activitySettings.wifi,
	resource: activitySettings.resource,
};
