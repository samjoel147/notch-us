import { MusicIcon } from "lucide-react";
/**
 * Music module — Universal Adaptive Media Experience Engine.
 * Supports Spotify, YouTube Music, Apple Music, and any other player exposed
 * through the Windows SMTC media transport controls.
 */
import { useSetting } from "../../core/settings";
import type { IslandModule, ModuleView } from "../../core/types";
import { Artwork } from "./components/Artwork";
import { MusicCompactLeft, MusicCompactRight, MusicIdleLeft, MusicIdleRight } from "./components/MusicCompact";
import { MusicPanel } from "./components/MusicPanel";
import { SpotifySettings } from "./components/SpotifySettings";
import { useAccentColor } from "./hooks/useAccentColor";
import { useMusic } from "./hooks/useMusic";
import { musicSettings, musicToggleSettings } from "./settings";

export const musicModule: IslandModule = {
	id: "music",
	title: "music.title",
	settingsIcon: <MusicIcon size={15} />,
	settings: musicToggleSettings,
	SettingsSection: SpotifySettings,
	useView(): ModuleView {
		const { music, active } = useMusic();
		const accent = useAccentColor(music?.thumbnail);
		const autoExpand = useSetting(musicSettings.autoExpand);
		const showVisualizer = useSetting(musicSettings.visualizer);

		return {
			active,
			priority: music?.playing ? 50 : 10,
			icon: <Artwork src={music?.thumbnail} size={22} radius={11} />,
			compact: music
				? {
						left: <MusicCompactLeft music={music} />,
						right: <MusicCompactRight music={music} accent={accent} showVisualizer={showVisualizer} />,
						width: 340,
					}
				: {
						left: <MusicIdleLeft />,
						right: <MusicIdleRight />,
						width: 180,
					},
			expanded: <MusicPanel music={music} accent={accent} showVisualizer={showVisualizer} />,
			expandedSize: { width: 560, height: 176 },
			activityKey: autoExpand && music?.playing ? `${music.title}|${music.artist}` : undefined,
		};
	},
};
