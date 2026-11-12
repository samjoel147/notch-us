import { BellIcon } from "lucide-react";
/**
 * Windows notifications — WhatsApp, Teams, Outlook… mirrored into the
 * island. New ones arrive as alerts (through the activities module); this
 * module keeps the recent history. Backend: `src-tauri/src/providers/notifications/`.
 */
import { Badge } from "../../components/Glyph";
import { Marquee } from "../../components/Marquee";
import { useProvider } from "../../core/bridge";
import type { IslandModule, ModuleView } from "../../core/types";
import { useNow } from "../ai-agents/common/format";
import { NotificationsPanel } from "./components/NotificationsPanel";
import { NotificationsSettings } from "./components/NotificationsSettings";
import { identifyPlatform } from "./platforms";
import { notificationToggleSettings } from "./settings";
import { NOTIFICATION_BLUE, NOTIFICATIONS_PROVIDER, type NotificationsState } from "./types";

/** Unread notifications this recent keep a spot in the compact island. */
const UNREAD_WINDOW_MS = 5 * 60_000;
const ROW = 68;

export const notificationsModule: IslandModule = {
	id: "notifications",
	title: "notifications.title",
	settingsIcon: <BellIcon size={14} />,
	settings: notificationToggleSettings,
	SettingsSection: NotificationsSettings,
	useView(): ModuleView {
		const state = useProvider<NotificationsState>(NOTIFICATIONS_PROVIDER);
		const items = state?.items ?? [];
		const now = useNow(30_000, items.length > 0);
		const unread = items.filter((i) => !i.read);
		const latest = items[0];
		const recent = !!latest && !latest.read && now - latest.receivedAt < UNREAD_WINDOW_MS;
		const platform = latest ? identifyPlatform(latest.app, latest.aumid) : null;
		const accent = platform ? platform.brandColor : NOTIFICATION_BLUE;

		return {
			active: recent,
			priority: 30,
			hidden: items.length === 0,
			accent,
			icon: <BellIcon size={14} color={accent} />,
			compact: latest && {
				left: (
					<>
						<Badge icon="bell" image={latest.logo} color={accent} size={24} radius={7} glyphSize={12} />
						<div className="flex min-w-0 items-center gap-1.5">
							{platform && platform.id !== "generic" && (
								<span
									className="rounded px-1 text-[10px] font-bold uppercase tracking-wider"
									style={{ backgroundColor: `${accent}25`, color: accent }}
								>
									{platform.name}
								</span>
							)}
							<Marquee text={latest.title} className="max-w-48 text-[13px] font-semibold" />
						</div>
					</>
				),
				right:
					unread.length > 1 ? (
						<span className="text-[12px] font-[650]" style={{ color: accent }}>
							+{unread.length - 1}
						</span>
					) : null,
				width: 340,
			},
			expanded: <NotificationsPanel state={state} />,
			expandedSize: { width: 560, height: 72 + Math.min(Math.max(items.length, 1), 4) * ROW },
		};
	},
};
