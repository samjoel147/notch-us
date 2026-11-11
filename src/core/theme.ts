import { useEffect, useState } from "react";
import type { MessageKey } from "./i18n";
import { appearanceSettings, readSetting, useSettings } from "./settings";

export type ThemeId =
	| "dark"
	| "light"
	| "glass-dark"
	| "glass-light"
	| "cyberpunk"
	| "midnight"
	| "sunset"
	| "aurora"
	| "auto";

export interface ThemeDef {
	id: ThemeId;
	name: MessageKey;
	desc: MessageKey;
	isLight: boolean;
	isGlass: boolean;
	previewBg: string;
	previewBorder: string;
	previewAccent: string;
	glassTint?: string;
}

export const THEMES: ThemeDef[] = [
	{
		id: "glass-dark",
		name: "appearance.theme.glassDark",
		desc: "appearance.theme.glassDarkDesc",
		isLight: false,
		isGlass: true,
		previewBg: "linear-gradient(135deg, rgba(35, 38, 54, 0.88) 0%, rgba(14, 16, 24, 0.96) 100%)",
		previewBorder: "rgba(255, 255, 255, 0.35)",
		previewAccent: "#8b92ff",
		glassTint: "rgba(18, 20, 30, 0.70)",
	},
	{
		id: "glass-light",
		name: "appearance.theme.glassLight",
		desc: "appearance.theme.glassLightDesc",
		isLight: true,
		isGlass: true,
		previewBg: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(230, 238, 252, 0.88) 100%)",
		previewBorder: "rgba(255, 255, 255, 0.95)",
		previewAccent: "#007aff",
		glassTint: "rgba(250, 250, 252, 0.88)",
	},
	{
		id: "dark",
		name: "appearance.theme.dark",
		desc: "appearance.theme.darkDesc",
		isLight: false,
		isGlass: false,
		previewBg: "linear-gradient(135deg, #18181c 0%, #000000 100%)",
		previewBorder: "rgba(255, 255, 255, 0.1)",
		previewAccent: "#a0a4ff",
	},
	{
		id: "light",
		name: "appearance.theme.light",
		desc: "appearance.theme.lightDesc",
		isLight: true,
		isGlass: false,
		previewBg: "linear-gradient(135deg, #f5f5f7 0%, #ffffff 100%)",
		previewBorder: "rgba(0, 0, 0, 0.12)",
		previewAccent: "#0066cc",
	},
	{
		id: "cyberpunk",
		name: "appearance.theme.cyberpunk",
		desc: "appearance.theme.cyberpunkDesc",
		isLight: false,
		isGlass: false,
		previewBg: "linear-gradient(135deg, #090915 0%, #030308 100%)",
		previewBorder: "#00f0ff",
		previewAccent: "#ff007f",
	},
	{
		id: "midnight",
		name: "appearance.theme.midnight",
		desc: "appearance.theme.midnightDesc",
		isLight: false,
		isGlass: false,
		previewBg: "linear-gradient(135deg, #0f172a 0%, #0284c7 100%)",
		previewBorder: "rgba(56, 189, 248, 0.4)",
		previewAccent: "#38bdf8",
	},
	{
		id: "sunset",
		name: "appearance.theme.sunset",
		desc: "appearance.theme.sunsetDesc",
		isLight: false,
		isGlass: false,
		previewBg: "linear-gradient(135deg, #451a03 0%, #ea580c 100%)",
		previewBorder: "rgba(251, 146, 60, 0.45)",
		previewAccent: "#fb923c",
	},
	{
		id: "aurora",
		name: "appearance.theme.aurora",
		desc: "appearance.theme.auroraDesc",
		isLight: false,
		isGlass: false,
		previewBg: "linear-gradient(135deg, #022c22 0%, #059669 100%)",
		previewBorder: "rgba(52, 211, 153, 0.45)",
		previewAccent: "#34d399",
	},
	{
		id: "auto",
		name: "appearance.theme.auto",
		desc: "appearance.theme.autoDesc",
		isLight: false,
		isGlass: false,
		previewBg: "linear-gradient(135deg, #18181c 50%, #ffffff 50%)",
		previewBorder: "rgba(255, 255, 255, 0.15)",
		previewAccent: "#0A84FF",
	},
];

/** Resolves "auto" against system prefers-color-scheme. */
export function resolveThemeId(id: ThemeId, systemIsDark: boolean): ThemeId {
	if (id !== "auto") return id;
	return systemIsDark ? "dark" : "light";
}

export function getThemeDef(id: ThemeId, systemIsDark = true): ThemeDef {
	const resolved = resolveThemeId(id, systemIsDark);
	return THEMES.find((t) => t.id === resolved) ?? THEMES[0];
}

/** Hook that syncs the active theme dataset attributes on documentElement. */
export function useThemeSync(themeId: ThemeId): ThemeDef {
	const [systemIsDark, setSystemIsDark] = useState(() => {
		if (typeof window === "undefined" || !window.matchMedia) return true;
		return window.matchMedia("(prefers-color-scheme: dark)").matches;
	});

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, []);

	const active = getThemeDef(themeId, systemIsDark);

	useEffect(() => {
		const root = document.documentElement;
		root.dataset.theme = active.id;
		root.dataset.light = active.isLight ? "true" : "false";
		root.dataset.glassTheme = active.isGlass ? "true" : "false";
	}, [active]);

	return active;
}

export function useActiveTheme(): ThemeDef {
	const s = useSettings();
	const themeId = (readSetting(s, appearanceSettings.theme) as ThemeId) || "dark";
	return useThemeSync(themeId);
}
