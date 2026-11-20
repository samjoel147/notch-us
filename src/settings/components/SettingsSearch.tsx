import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useT } from "../../core/i18n";

export interface SearchItem {
	id: string;
	title: string;
	category: string;
	path: string;
	keywords?: string[];
}

export function SettingsSearch() {
	const t = useT();
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [focused, setFocused] = useState(false);
	const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
		};
	}, []);

	const items: SearchItem[] = useMemo(
		() => [
			// General
			{
				id: "general.language",
				title: t("settings.language.label"),
				category: t("settings.general"),
				path: "/",
			},
			{
				id: "general.autostart",
				title: t("settings.autostart.label"),
				category: t("settings.general"),
				path: "/",
			},
			{
				id: "general.monitor",
				title: t("settings.monitor.label"),
				category: t("settings.general"),
				path: "/",
			},

			// Sound
			{
				id: "sound.master",
				title: t("sound.enabled.label"),
				category: t("sound.title"),
				path: "/sound",
			},
			{
				id: "sound.alerts",
				title: t("sound.alerts.label"),
				category: t("sound.title"),
				path: "/sound",
			},
			{
				id: "sound.volumeClicks",
				title: t("sound.volumeClicks.label"),
				category: t("sound.title"),
				path: "/sound",
			},
			{
				id: "sound.timerChimes",
				title: t("sound.timerChimes.label"),
				category: t("sound.title"),
				path: "/sound",
			},
			{
				id: "sound.output",
				title: t("sound.outputDevice.label"),
				category: t("sound.title"),
				path: "/sound",
			},

			// Appearance
			{
				id: "appearance.theme",
				title: t("appearance.theme.label"),
				category: t("appearance.title"),
				path: "/appearance",
			},
			{
				id: "appearance.scale",
				title: t("appearance.scale.label"),
				category: t("appearance.title"),
				path: "/appearance",
			},
			{
				id: "appearance.glass",
				title: t("appearance.glass.label"),
				category: t("appearance.title"),
				path: "/appearance",
			},
			{
				id: "appearance.border",
				title: t("appearance.border.label"),
				category: t("appearance.title"),
				path: "/appearance",
			},
			{
				id: "appearance.idleClock",
				title: t("appearance.idleClock.label"),
				category: t("appearance.title"),
				path: "/appearance",
			},

			// Behavior
			{
				id: "behavior.openOn",
				title: t("behavior.openOn.label"),
				category: t("behavior.title"),
				path: "/behavior",
			},
			{
				id: "behavior.closeOn",
				title: t("behavior.closeOn.label"),
				category: t("behavior.title"),
				path: "/behavior",
			},
			{
				id: "behavior.hoverDelay",
				title: t("behavior.hoverDelay.label"),
				category: t("behavior.title"),
				path: "/behavior",
			},
			{
				id: "behavior.fullscreen",
				title: t("settings.hideInFullscreen.label"),
				category: t("behavior.title"),
				path: "/behavior",
			},
			{
				id: "behavior.leaveDelay",
				title: t("behavior.leaveDelay.label"),
				category: t("behavior.title"),
				path: "/behavior",
			},

			// Activities & Pop Notifications
			{
				id: "activities.popAlerts",
				title: t("activities.popAlerts.title"),
				category: t("activities.title"),
				path: "/modules/activities",
			},
			{
				id: "activities.charging",
				title: t("activities.alert.charging.label"),
				category: t("activities.title"),
				path: "/modules/activities",
				keywords: ["battery", "plug"],
			},
			{
				id: "activities.lowBattery",
				title: t("activities.alert.lowBattery.label"),
				category: t("activities.title"),
				path: "/modules/activities",
				keywords: ["battery"],
			},
			{
				id: "activities.powerSaver",
				title: t("activities.alert.powerSaver.label"),
				category: t("activities.title"),
				path: "/modules/activities",
				keywords: ["leaf", "eco"],
			},
			{
				id: "activities.volume",
				title: t("activities.alert.volume.label"),
				category: t("activities.title"),
				path: "/modules/activities",
				keywords: ["sound", "audio"],
			},
			{
				id: "activities.brightness",
				title: t("activities.alert.brightness.label"),
				category: t("activities.title"),
				path: "/modules/activities",
				keywords: ["sun", "screen"],
			},
			{
				id: "activities.capsLock",
				title: t("activities.alert.capsLock.label"),
				category: t("activities.title"),
				path: "/modules/activities",
				keywords: ["keyboard", "led"],
			},
			{
				id: "activities.numLock",
				title: t("activities.alert.numLock.label"),
				category: t("activities.title"),
				path: "/modules/activities",
				keywords: ["keyboard", "led"],
			},
			{
				id: "activities.wifi",
				title: t("activities.alert.wifi.label"),
				category: t("activities.title"),
				path: "/modules/activities",
				keywords: ["network", "internet"],
			},
			{
				id: "activities.airplane",
				title: t("activities.alert.airplane.label"),
				category: t("activities.title"),
				path: "/modules/activities",
				keywords: ["wireless"],
			},
			{
				id: "activities.resource",
				title: t("activities.alert.resource.label"),
				category: t("activities.title"),
				path: "/modules/activities",
				keywords: ["monitor", "usage"],
			},
			{
				id: "activities.bluetooth",
				title: t("activities.alert.bluetooth.label"),
				category: t("activities.title"),
				path: "/modules/activities",
				keywords: ["headphones", "airpods"],
			},
			{
				id: "activities.privacy",
				title: t("activities.alert.privacy.label"),
				category: t("activities.title"),
				path: "/modules/activities",
				keywords: ["mic", "webcam"],
			},

			// Notifications & Sound Deck
			{
				id: "notifications.soundDeck",
				title: t("notifications.settings.showSoundDeck.label"),
				category: t("notifications.title"),
				path: "/modules/notifications",
				keywords: ["volume", "audio switcher"],
			},
			{
				id: "notifications.dnd",
				title: t("notifications.settings.doNotDisturb.label"),
				category: t("notifications.title"),
				path: "/modules/notifications",
			},
			{
				id: "notifications.privacy",
				title: t("notifications.settings.privacyMode.label"),
				category: t("notifications.title"),
				path: "/modules/notifications",
			},

			// Hydration
			{
				id: "hydration.dailyGoal",
				title: t("hydration.goal.label"),
				category: t("hydration.title"),
				path: "/modules/hydration",
				keywords: ["water", "glasses"],
			},
			{
				id: "hydration.interval",
				title: t("hydration.interval.label"),
				category: t("hydration.title"),
				path: "/modules/hydration",
			},

			// Pomodoro
			{
				id: "pomodoro.work",
				title: t("pomodoro.workDuration.label"),
				category: t("pomodoro.title"),
				path: "/modules/pomodoro",
				keywords: ["timer", "break"],
			},
			{
				id: "pomodoro.autoStart",
				title: t("pomodoro.autoStartBreak.label"),
				category: t("pomodoro.title"),
				path: "/modules/pomodoro",
			},

			// Clipboard
			{
				id: "clipboard.history",
				title: t("clipboard.historyLimit.label"),
				category: t("clipboard.title"),
				path: "/modules/clipboard",
				keywords: ["copy", "paste"],
			},
			{
				id: "clipboard.swatches",
				title: t("clipboard.captureColors.label"),
				category: t("clipboard.title"),
				path: "/modules/clipboard",
			},
			{
				id: "clipboard.images",
				title: t("clipboard.picture"),
				category: t("clipboard.title"),
				path: "/modules/clipboard",
			},

			// System Monitor
			{
				id: "monitor.spikes",
				title: t("monitor.cpuThreshold.label"),
				category: t("monitor.title"),
				path: "/modules/monitor",
			},
			{
				id: "monitor.refresh",
				title: t("monitor.pollRate.label"),
				category: t("monitor.title"),
				path: "/modules/monitor",
			},

			// Shortcuts
			{
				id: "shortcuts.overview",
				title: t("shortcuts.title"),
				category: t("shortcuts.title"),
				path: "/shortcuts",
				keywords: ["hotkey", "keybind"],
			},
		],
		[t],
	);

	const results = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		return items
			.filter(
				(item) =>
					item.title.toLowerCase().includes(q) ||
					item.category.toLowerCase().includes(q) ||
					item.keywords?.some((k) => k.toLowerCase().includes(q)),
			)
			.slice(0, 8);
	}, [query, items]);

	const handleSelect = (path: string) => {
		navigate(path);
		setQuery("");
		setFocused(false);
	};

	return (
		<div className="relative w-full px-2.5 pb-2">
			<div className="relative flex items-center">
				<SearchIcon size={13} className="pointer-events-none absolute left-2.5 text-text-faint" />
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => {
						if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
						setFocused(true);
					}}
					onBlur={() => {
						blurTimerRef.current = setTimeout(() => setFocused(false), 200);
					}}
					placeholder={t("settings.searchPlaceholder")}
					className="h-8 w-full rounded-lg bg-white/6 pl-8 pr-7 text-[12px] text-text placeholder:text-text-faint border border-hairline focus:border-[var(--accent,#38bdf8)] focus:bg-white/10 focus:outline-none transition-colors"
				/>
				{query && (
					<button
						type="button"
						onClick={() => setQuery("")}
						className="absolute right-2 text-text-faint hover:text-text cursor-pointer"
					>
						<XIcon size={12} />
					</button>
				)}
			</div>

			{/* Search Dropdown Popover */}
			{focused && results.length > 0 && (
				<div className="absolute top-10 left-2.5 right-2.5 z-50 flex flex-col rounded-xl bg-card backdrop-blur-xl border border-hairline p-1 shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
					{results.map((r) => (
						<button
							key={r.id}
							type="button"
							onMouseDown={() => handleSelect(r.path)}
							className="flex flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10 transition-colors cursor-pointer"
						>
							<span className="text-[12px] font-semibold text-text">{r.title}</span>
							<span className="text-[10px] text-text-dim">{r.category}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
