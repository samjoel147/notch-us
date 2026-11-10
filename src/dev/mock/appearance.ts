import { BORDER_PRESETS, type BorderPreset } from "../../core/appearance";
import {
	appearanceSettings,
	GLASS_LEVELS,
	type GlassLevel,
	getSettings,
	type IslandStyle,
	readSetting,
	setSetting,
} from "../../core/settings";
import { THEMES, type ThemeDef, type ThemeId } from "../../core/theme";
import { changed, defineMock } from "./kit";

export const appearanceMock = defineMock({
	label: "Theme & Appearance",
	controls: [
		{
			kind: "select",
			label: "Theme",
			options: THEMES.map((t: ThemeDef) => t.id),
			value: () => (readSetting(getSettings(), appearanceSettings.theme) as string) || "dark",
			set: (v) => {
				setSetting(appearanceSettings.theme, v as ThemeId);
				changed();
			},
		},
		{
			kind: "select",
			label: "Style",
			options: ["dynamic", "windows"] as const,
			value: () => readSetting(getSettings(), appearanceSettings.style) || "dynamic",
			set: (v) => {
				setSetting(appearanceSettings.style, v as IslandStyle);
				changed();
			},
		},
		{
			kind: "select",
			label: "Rim preset",
			options: BORDER_PRESETS.map((p: BorderPreset) => p.id),
			value: () => readSetting(getSettings(), appearanceSettings.border) || "none",
			set: (v) => {
				setSetting(appearanceSettings.border, v);
				changed();
			},
		},
		{
			kind: "select",
			label: "Glass blur",
			options: GLASS_LEVELS,
			value: () => readSetting(getSettings(), appearanceSettings.glass) || "off",
			set: (v) => {
				setSetting(appearanceSettings.glass, v as GlassLevel);
				changed();
			},
		},
		{
			kind: "toggle",
			label: "Animate rim",
			value: () => !!readSetting(getSettings(), appearanceSettings.animate),
			set: (on) => {
				setSetting(appearanceSettings.animate, on);
				changed();
			},
		},
		{
			kind: "toggle",
			label: "Rim glow",
			value: () => !!readSetting(getSettings(), appearanceSettings.glow),
			set: (on) => {
				setSetting(appearanceSettings.glow, on);
				changed();
			},
		},
		{
			kind: "range",
			label: "Thickness",
			min: 1,
			max: 3,
			step: 1,
			value: () => Number(readSetting(getSettings(), appearanceSettings.thickness)) || 2,
			set: (v) => {
				setSetting(appearanceSettings.thickness, v);
				changed();
			},
		},
		{
			kind: "button",
			label: "Open Settings window ↗",
			run: () => {
				window.open(`${window.location.origin}/#settings`, "_blank");
			},
		},
	],
});
