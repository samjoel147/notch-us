import type { SettingDef } from "../../core/settings";
import type { GlassMaterialId } from "./materials/material.types";
import type { MusicThemeId } from "./themes/theme.types";

export const musicSettings = {
	material: {
		key: "music.material.label",
		label: "music.material.label",
		description: "music.material.desc",
		default: "liquid" as GlassMaterialId,
	} satisfies SettingDef<GlassMaterialId>,
	theme: {
		key: "music.theme.label",
		label: "music.theme.label",
		description: "music.theme.desc",
		default: "auto" as MusicThemeId,
	} satisfies SettingDef<MusicThemeId>,
	ambientGlow: {
		key: "music.ambientGlow.label",
		label: "music.ambientGlow.label",
		description: "music.ambientGlow.desc",
		default: true,
	} satisfies SettingDef<boolean>,
	autoExpand: {
		key: "music.autoExpand.label",
		label: "music.autoExpand.label",
		description: "music.autoExpand.desc",
		default: true,
	} satisfies SettingDef<boolean>,
	visualizer: {
		key: "music.visualizer.label",
		label: "music.visualizer.label",
		description: "music.visualizer.desc",
		default: true,
	} satisfies SettingDef<boolean>,
	// Read by the backend too (`smtc.rs`): off means no YouTube lookups at all.
	video: {
		key: "music.video.label",
		label: "music.video.label",
		description: "music.video.desc",
		default: false,
	} satisfies SettingDef<boolean>,
};

export const musicToggleSettings: SettingDef<boolean>[] = [
	musicSettings.ambientGlow,
	musicSettings.autoExpand,
	musicSettings.visualizer,
	musicSettings.video,
];
