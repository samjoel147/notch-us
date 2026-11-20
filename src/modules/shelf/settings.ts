import type { SettingDef } from "../../core/settings";

export const shelfSettings = {
	autoClear: {
		key: "shelf.autoClear",
		label: "shelf.autoClear.label",
		description: "shelf.autoClear.desc",
		default: false,
	},
	confirmClear: {
		key: "shelf.confirmClear",
		label: "shelf.confirmClear.label",
		description: "shelf.confirmClear.desc",
		default: true,
	},
	defaultGrid: {
		key: "shelf.defaultGrid",
		label: "shelf.defaultGrid.label",
		description: "shelf.defaultGrid.desc",
		default: true,
	},
} satisfies Record<string, SettingDef>;
