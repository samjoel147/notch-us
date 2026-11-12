import type { SettingDef } from "../../core/settings";

export const notificationSettings = {
	quickReply: {
		key: "module.notifications.quickReply",
		label: "notifications.settings.quickReply.label",
		description: "notifications.settings.quickReply.desc",
		default: true,
	} satisfies SettingDef<boolean>,
	smartClipboard: {
		key: "module.notifications.smartClipboard",
		label: "notifications.settings.smartClipboard.label",
		description: "notifications.settings.smartClipboard.desc",
		default: true,
	} satisfies SettingDef<boolean>,
	autoDismissOnReply: {
		key: "module.notifications.autoDismiss",
		label: "notifications.settings.autoDismiss.label",
		description: "notifications.settings.autoDismiss.desc",
		default: true,
	} satisfies SettingDef<boolean>,
	platformBadges: {
		key: "module.notifications.platformBadges",
		label: "notifications.settings.platformBadges.label",
		description: "notifications.settings.platformBadges.desc",
		default: true,
	} satisfies SettingDef<boolean>,
	reactionPills: {
		key: "module.notifications.reactionPills",
		label: "notifications.settings.reactionPills.label",
		description: "notifications.settings.reactionPills.desc",
		default: ["👍", "❤️", "OK!", "On my way", "Can't talk now"],
	} satisfies SettingDef<string[]>,
};

export const notificationToggleSettings: SettingDef<boolean>[] = [
	notificationSettings.quickReply,
	notificationSettings.smartClipboard,
	notificationSettings.autoDismissOnReply,
	notificationSettings.platformBadges,
];
