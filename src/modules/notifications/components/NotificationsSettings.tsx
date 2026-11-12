import { MessageSquareReplyIcon, PlusIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Block, Desc, Row } from "../../../components/ui/card";
import { Input } from "../../../components/ui/form";
import { Chip, Chips } from "../../../components/ui/text";
import { providerAction, useProvider } from "../../../core/bridge";
import { useT } from "../../../core/i18n";
import { readSetting, setSetting, useSetting, useSettings } from "../../../core/settings";
import { ToggleRow } from "../../../settings/components/Toggle";
import { PLATFORMS } from "../platforms";
import { notificationSettings } from "../settings";
import { NOTIFICATIONS_PROVIDER, type NotificationsState } from "../types";

export function NotificationsSettings() {
	const t = useT();
	const values = useSettings();
	const state = useProvider<NotificationsState>(NOTIFICATIONS_PROVIDER);
	const [busy, setBusy] = useState(false);
	const [newChip, setNewChip] = useState("");
	const access = state?.access ?? "noIdentity";

	const chips = useSetting(notificationSettings.reactionPills) || notificationSettings.reactionPills.default;

	const handleAddChip = (e: FormEvent) => {
		e.preventDefault();
		const trimmed = newChip.trim();
		if (!trimmed || chips.includes(trimmed)) return;
		setSetting(notificationSettings.reactionPills, [...chips, trimmed]);
		setNewChip("");
	};

	const handleRemoveChip = (chipToRemove: string) => {
		if (chips.length <= 1) return;
		setSetting(
			notificationSettings.reactionPills,
			chips.filter((c) => c !== chipToRemove),
		);
	};

	const handleResetChips = () => {
		setSetting(notificationSettings.reactionPills, notificationSettings.reactionPills.default);
	};

	const supportedPlatforms = Object.values(PLATFORMS).filter((p) => p.id !== "generic");

	return (
		<>
			{/* Windows UserNotificationListener Access Card */}
			<Block>
				<Row label={t("notifications.access.title")} desc={t(`notifications.access.${access}`)}>
					{access === "noIdentity" && (
						<Button
							variant="primary"
							disabled={busy}
							onClick={async () => {
								setBusy(true);
								try {
									await providerAction(NOTIFICATIONS_PROVIDER, "enable");
								} catch {
									setBusy(false);
								}
							}}
						>
							{busy ? t("notifications.access.enabling") : t("notifications.access.enable")}
						</Button>
					)}
					{access === "denied" && (
						<Button onClick={() => providerAction(NOTIFICATIONS_PROVIDER, "openPrivacy")}>
							{t("notifications.access.openPrivacy")}
						</Button>
					)}
					{access === "allowed" && (
						<Chips>
							<Chip ok>{t("notifications.access.on")}</Chip>
						</Chips>
					)}
				</Row>
				{access === "noIdentity" && <Desc>{t("notifications.access.how")}</Desc>}
				{state?.error && (
					<>
						<Desc tone="error">{state.error}</Desc>
						<Button
							style={{ alignSelf: "flex-start" }}
							onClick={() => providerAction(NOTIFICATIONS_PROVIDER, "openDeveloper")}
						>
							{t("notifications.access.openDeveloper")}
						</Button>
					</>
				)}
			</Block>

			{/* Multi-Source Messaging & Quick Reply Preferences */}
			<Block>
				<div className="flex items-center gap-2 mb-1">
					<MessageSquareReplyIcon size={15} className="text-accent" />
					<span className="text-[13px] font-[650] text-text">Messaging & Quick Reply</span>
				</div>

				<ToggleRow def={notificationSettings.quickReply} value={readSetting(values, notificationSettings.quickReply)} />
				<ToggleRow
					def={notificationSettings.smartClipboard}
					value={readSetting(values, notificationSettings.smartClipboard)}
				/>
				<ToggleRow
					def={notificationSettings.autoDismissOnReply}
					value={readSetting(values, notificationSettings.autoDismissOnReply)}
				/>
				<ToggleRow
					def={notificationSettings.platformBadges}
					value={readSetting(values, notificationSettings.platformBadges)}
				/>
			</Block>

			{/* Quick Reaction Pills Customizer */}
			<Block>
				<Row
					label={t("notifications.settings.reactionPills.label")}
					desc={t("notifications.settings.reactionPills.desc")}
				>
					<Button onClick={handleResetChips} title="Reset defaults">
						<RotateCcwIcon size={12} className="mr-1 inline" />
						{t("notifications.settings.reactionPills.reset")}
					</Button>
				</Row>

				<div className="flex flex-wrap items-center gap-1.5 mt-2">
					{chips.map((chip) => (
						<div
							key={chip}
							className="group/chip flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-[12px] font-medium text-text border border-hairline shadow-xs"
						>
							<span>{chip}</span>
							<button
								type="button"
								className="grid size-4 place-items-center rounded-full text-text-dim hover:text-danger hover:bg-danger/10 transition-colors"
								title="Remove reaction"
								onClick={() => handleRemoveChip(chip)}
							>
								<XIcon size={10} />
							</button>
						</div>
					))}
				</div>

				<form className="flex gap-2 mt-2" onSubmit={handleAddChip}>
					<Input
						className="flex-1"
						value={newChip}
						placeholder="Add custom reaction (e.g. 'On it!', 'Talk soon')..."
						onChange={(e) => setNewChip(e.target.value)}
					/>
					<Button variant="primary" disabled={!newChip.trim()}>
						<PlusIcon size={13} className="mr-1 inline" />
						{t("notifications.settings.reactionPills.add")}
					</Button>
				</form>
			</Block>

			{/* Recognized Messaging Services Showcase */}
			<Block>
				<Row label={t("notifications.settings.platforms.title")} desc={t("notifications.settings.platforms.desc")} />
				<div className="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-3">
					{supportedPlatforms.map((platform) => (
						<div
							key={platform.id}
							className="flex items-center gap-2.5 rounded-2xl bg-card/60 p-2.5 border border-hairline"
						>
							<div
								className="grid size-8 place-items-center rounded-xl text-[12px] font-bold text-white shadow-xs"
								style={{
									backgroundColor: platform.brandColor,
								}}
							>
								{platform.name[0]}
							</div>
							<div className="flex min-w-0 flex-1 flex-col">
								<span className="truncate text-[12.5px] font-semibold text-text">{platform.name}</span>
								<span className="text-[10px] text-ok font-medium">Quick Reply active</span>
							</div>
						</div>
					))}
				</div>
			</Block>
		</>
	);
}
