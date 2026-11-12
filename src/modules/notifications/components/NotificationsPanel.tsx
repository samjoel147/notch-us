import { CheckIcon, CornerDownLeftIcon, MessageSquareReplyIcon, SendIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { TextButton } from "../../../components/ui/button";
import { Empty, SectionLabel } from "../../../components/ui/text";
import { providerAction } from "../../../core/bridge";
import { useT } from "../../../core/i18n";
import { useSetting } from "../../../core/settings";
import { formatAgo, useNow } from "../../ai-agents/common/format";
import { parseNotification } from "../platforms";
import { notificationSettings } from "../settings";
import { NOTIFICATIONS_PROVIDER, type NotificationItem, type NotificationsState } from "../types";

const MAX_ROWS = 4;

export function NotificationsPanel({ state }: { state: NotificationsState | undefined }) {
	const t = useT();
	const now = useNow(30_000);
	const items = state?.items.slice(0, MAX_ROWS) ?? [];
	const unread = state?.items.some((i) => !i.read) ?? false;

	const quickReplyEnabled = useSetting(notificationSettings.quickReply);
	const smartClipboardEnabled = useSetting(notificationSettings.smartClipboard);
	const platformBadgesEnabled = useSetting(notificationSettings.platformBadges);
	const reactionChips = useSetting(notificationSettings.reactionPills) || notificationSettings.reactionPills.default;

	const [replyingId, setReplyingId] = useState<number | null>(null);
	const [replyText, setReplyText] = useState("");
	const [feedback, setFeedback] = useState<{ id: number; message: string } | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Mark notifications as read when viewing panel
	useEffect(() => {
		if (unread) providerAction(NOTIFICATIONS_PROVIDER, "markRead");
	}, [unread]);

	// Auto-focus input when replying starts
	useEffect(() => {
		if (replyingId !== null) {
			inputRef.current?.focus();
		}
	}, [replyingId]);

	const handleSendReply = async (item: NotificationItem, textToSend?: string) => {
		const text = (textToSend ?? replyText).trim();
		if (!text) return;

		const parsed = parseNotification(item.app, item.aumid, item.title, item.body);

		// 1. Copy reply to clipboard if smart clipboard bridge is enabled
		if (smartClipboardEnabled) {
			try {
				await navigator.clipboard.writeText(text);
			} catch {
				// Clipboard API fallback handled by OS if blocked
			}
		}

		// 2. Dispatch backend action to focus app or launch protocol URI
		providerAction(NOTIFICATIONS_PROVIDER, "reply", {
			id: item.id,
			text,
			aumid: item.aumid,
			app: item.app,
			protocol: parsed.platform.protocolScheme,
		});

		// 3. Surface feedback to user
		setFeedback({
			id: item.id,
			message: `Reply copied • Opening ${parsed.platform.name}...`,
		});
		setReplyingId(null);
		setReplyText("");

		setTimeout(() => {
			setFeedback(null);
		}, 3000);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, item: NotificationItem) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendReply(item);
		} else if (e.key === "Escape") {
			e.preventDefault();
			setReplyingId(null);
			setReplyText("");
		}
	};

	return (
		<div className="flex h-full flex-col">
			{/* Top Header */}
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<SectionLabel>{t("notifications.title")}</SectionLabel>
					{items.length > 0 && (
						<span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold text-text-dim border border-hairline">
							{items.length}
						</span>
					)}
				</div>
				{items.length > 0 && (
					<TextButton
						onClick={(e) => {
							e.stopPropagation();
							providerAction(NOTIFICATIONS_PROVIDER, "clear");
						}}
					>
						{t("notifications.clear")}
					</TextButton>
				)}
			</div>

			{/* Empty State */}
			{items.length === 0 ? (
				<Empty>{t("notifications.empty")}</Empty>
			) : (
				<ul className="flex-1 list-none space-y-1.5 overflow-y-auto [scrollbar-width:none] pr-0.5" data-scroll>
					{items.map((item) => {
						const parsed = parseNotification(item.app, item.aumid, item.title, item.body);
						const isReplying = replyingId === item.id;
						const isSuccess = feedback?.id === item.id;

						return (
							<li
								key={item.id}
								className={`group/item relative flex flex-col rounded-2xl border transition-all duration-200 ${
									isReplying
										? "border-accent/40 bg-card p-3 shadow-lg"
										: "border-transparent bg-card/60 p-2.5 hover:border-hairline hover:bg-card"
								}`}
								onClick={() => {
									if (!isReplying) {
										providerAction(NOTIFICATIONS_PROVIDER, "open", item.id);
									}
								}}
							>
								{/* Main Message Card Row */}
								<div className="flex items-start gap-3">
									{/* Avatar / App Brand Indicator */}
									<div className="relative flex-none">
										{item.logo ? (
											<img
												src={item.logo}
												alt={parsed.platform.name}
												className="size-9 rounded-xl object-contain bg-white/5 p-1 shadow-sm border border-hairline"
											/>
										) : (
											<div
												className="grid size-9 place-items-center rounded-xl text-[12px] font-bold text-white shadow-sm"
												style={{
													background: `linear-gradient(135deg, ${parsed.platform.brandColor}, ${parsed.platform.brandColor}cc)`,
												}}
											>
												{parsed.avatarText}
											</div>
										)}

										{/* Platform corner dot */}
										{platformBadgesEnabled && (
											<span
												className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-island shadow-xs grid place-items-center"
												style={{ backgroundColor: parsed.platform.brandColor }}
											/>
										)}
									</div>

									{/* Message Body Content */}
									<div className="flex min-w-0 flex-1 flex-col justify-center">
										<div className="flex items-center gap-1.5 mb-0.5">
											<span className="truncate text-[13px] font-semibold text-text">{parsed.sender}</span>
											{parsed.chatTitle && (
												<span className="truncate text-[11px] text-text-dim">in {parsed.chatTitle}</span>
											)}
											{platformBadgesEnabled && (
												<span
													className="ml-auto flex-none rounded-md px-1.5 py-0.2 text-[10px] font-medium"
													style={{
														backgroundColor: `${parsed.platform.brandColor}18`,
														color: parsed.platform.brandColor,
													}}
												>
													{parsed.platform.name}
												</span>
											)}
											<span className="flex-none text-[11px] text-text-faint">
												{formatAgo(t, item.receivedAt, now)}
											</span>
										</div>

										<p className="line-clamp-2 text-[12.5px]/[1.35] text-text-dim">{parsed.content}</p>
									</div>

									{/* Item Actions (Reply & Dismiss) */}
									<div
										className="flex flex-none items-center gap-1 opacity-80 transition-opacity group-hover/item:opacity-100"
										onClick={(e) => e.stopPropagation()}
									>
										{quickReplyEnabled && parsed.platform.canQuickReply && !isReplying && (
											<button
												type="button"
												className="grid size-7 place-items-center rounded-xl bg-card border border-hairline text-text-dim hover:text-text hover:bg-white/10 active:scale-95 transition-all"
												title={`Reply to ${parsed.sender}`}
												onClick={() => {
													setReplyingId(item.id);
													setReplyText("");
												}}
											>
												<MessageSquareReplyIcon size={13} />
											</button>
										)}

										<button
											type="button"
											className="grid size-7 place-items-center rounded-xl bg-card border border-hairline text-text-dim hover:text-danger hover:bg-danger/10 active:scale-95 transition-all"
											title="Dismiss"
											onClick={() => {
												providerAction(NOTIFICATIONS_PROVIDER, "dismiss", item.id);
											}}
										>
											<XIcon size={12} />
										</button>
									</div>
								</div>

								{/* Feedback Notification (e.g. Reply Sent / Copied) */}
								{isSuccess && (
									<div className="mt-2 flex items-center gap-2 rounded-xl bg-ok/15 px-2.5 py-1 text-[11.5px] font-medium text-ok border border-ok/25">
										<CheckIcon size={13} />
										<span>{feedback.message}</span>
									</div>
								)}

								{/* In-Island Interactive Quick Reply Composer */}
								<AnimatePresence>
									{isReplying && (
										<motion.div
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: "auto" }}
											exit={{ opacity: 0, height: 0 }}
											transition={{ duration: 0.18 }}
											className="mt-2.5 flex flex-col gap-2 border-t border-hairline pt-2"
											onClick={(e) => e.stopPropagation()}
										>
											{/* Quick Reaction / Suggestion Chips */}
											<div className="flex flex-wrap items-center gap-1.5">
												{(reactionChips.length > 0 ? reactionChips : parsed.platform.defaultSuggestions).map(
													(suggestion) => (
														<button
															key={suggestion}
															type="button"
															className="rounded-full bg-card px-2.5 py-0.5 text-[11px] font-medium text-text-dim hover:bg-white/12 hover:text-text border border-hairline transition-all active:scale-95"
															onClick={() => handleSendReply(item, suggestion)}
														>
															{suggestion}
														</button>
													),
												)}
											</div>

											{/* Input Bar */}
											<div className="relative flex items-center gap-1.5">
												<input
													ref={inputRef}
													type="text"
													value={replyText}
													placeholder={`Reply to ${parsed.sender}...`}
													className="h-8 flex-1 rounded-xl bg-island/90 px-3 text-[12.5px] text-text placeholder:text-text-faint border border-hairline outline-none focus:border-accent transition-colors"
													onChange={(e) => setReplyText(e.target.value)}
													onKeyDown={(e) => handleKeyDown(e, item)}
												/>

												<button
													type="button"
													disabled={!replyText.trim()}
													className="grid size-8 place-items-center rounded-xl bg-accent text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all shadow-sm"
													title="Send reply (Enter)"
													onClick={() => handleSendReply(item)}
												>
													<SendIcon size={13} />
												</button>

												<button
													type="button"
													className="grid size-8 place-items-center rounded-xl bg-card text-text-dim hover:text-text border border-hairline active:scale-95 transition-all"
													title="Cancel (Esc)"
													onClick={() => {
														setReplyingId(null);
														setReplyText("");
													}}
												>
													<XIcon size={13} />
												</button>
											</div>

											<div className="flex items-center justify-between text-[10.5px] text-text-faint px-1">
												<span>Press Enter to send · Esc to cancel</span>
												<span className="flex items-center gap-1">
													<CornerDownLeftIcon size={10} /> Fast send
												</span>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
