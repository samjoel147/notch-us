import {
	ClipboardIcon,
	CopyIcon,
	ExternalLinkIcon,
	EyeIcon,
	EyeOffIcon,
	FolderIcon,
	LockIcon,
	MessageCircleIcon,
	PinIcon,
	TextIcon,
} from "lucide-react";
import { type PointerEvent, type ReactNode, useRef, useState } from "react";
import { TextButton } from "../../../components/ui/button";
import { providerAction } from "../../../core/bridge";
import { cn } from "../../../core/cn";
import { type Translate, useT } from "../../../core/i18n";
import { useIsland } from "../../../core/island";
import { useSetting } from "../../../core/settings";
import { formatAgo, useNow } from "../../ai-agents/common/format";
import { attachFiles, draftRequest, requestAskFocus, useAskEnabled } from "../../ask/store";
import { addToShelf } from "../../shelf/actions";
import { clipboardSettings } from "../settings";
import { CLIPBOARD_PROVIDER, CLIPBOARD_YELLOW, type ClipboardState, type ClipItem, clipAction } from "../types";

const DRAG_THRESHOLD = 5;
/** How long "Copied!" / "Kept" stays on a row. */
const FEEDBACK_MS = 1400;

export interface SecretInfo {
	type: string;
	label: string;
}

/** Identifies sensitive API tokens, private keys, and authorization secrets. */
export function detectSecret(text: string | null | undefined): SecretInfo | null {
	if (!text) return null;
	if (/sk-ant-[a-zA-Z0-9_-]{10,}/i.test(text)) return { type: "anthropic", label: "Anthropic API Key" };
	if (/sk-[a-zA-Z0-9_-]{20,}/i.test(text)) return { type: "openai", label: "OpenAI API Key" };
	if (/(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{20,}/.test(text)) return { type: "github", label: "GitHub Token" };
	if (/(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/.test(text)) return { type: "aws", label: "AWS Key" };
	if (/eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+/.test(text))
		return { type: "jwt", label: "JWT Token" };
	if (/xox[baprs]-[0-9a-zA-Z]{10,48}/.test(text)) return { type: "slack", label: "Slack Token" };
	if (/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/.test(text)) return { type: "private_key", label: "Private Key" };
	if (/(?:bearer\s+[a-zA-Z0-9_\-.]{25,})/i.test(text)) return { type: "bearer", label: "Bearer Token" };
	if (/(?:api[_-]?key|secret[_-]?key|auth[_-]?token)[\s:=]+['"]?[a-zA-Z0-9_-]{16,}['"]?/i.test(text))
		return { type: "token", label: "API Secret" };
	return null;
}

/** What the item is, on one line ("Picture 1920×1080", "3 files", the text). */
export function clipTitle(t: Translate, item: ClipItem, maskSecret = false): string {
	if (maskSecret && item.kind === "text") {
		const secret = detectSecret(item.preview);
		if (secret) {
			return `•••••••••••••••• (${t("clipboard.secretMasked", { type: secret.label })})`;
		}
	}
	if (item.kind === "image") {
		return item.screenshot
			? t("clipboard.screenshot")
			: t("clipboard.picture", { w: item.width ?? 0, h: item.height ?? 0 });
	}
	if (item.kind === "files")
		return item.names.length === 1 ? item.names[0] : t("clipboard.files", { n: item.names.length });
	return item.preview ?? "";
}

/**
 * The latest picture, shown big while it's fresh (a screenshot that just
 * opened the island), then the history. `hero` comes from the module view so
 * the panel size matches.
 */
export function ClipboardPanel({ state, hero }: { state: ClipboardState | undefined; hero: boolean }) {
	const t = useT();
	const maskSecrets = useSetting(clipboardSettings.maskSecrets);
	const [unmasked, setUnmasked] = useState<Record<number, boolean>>({});

	const toggleUnmask = (id: number) => {
		setUnmasked((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const items = state?.items ?? [];
	const heroItem = hero && items[0]?.kind === "image" ? items[0] : null;
	const listItems = heroItem ? items.slice(1) : items;
	const sorted = [...listItems].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

	return (
		<div className="flex h-full flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
			<div className="flex items-center justify-between gap-3">
				<span className="text-[12px] text-text-dim">{items.length ? t("clipboard.hint") : t("clipboard.empty")}</span>
				{items.length > 0 && (
					<TextButton onClick={() => providerAction(CLIPBOARD_PROVIDER, "clear")}>{t("clipboard.clear")}</TextButton>
				)}
			</div>
			{heroItem ? (
				<>
					<Hero item={heroItem} />
					<ul className="min-h-0 flex-1 list-none overflow-y-auto [scrollbar-width:none]" data-scroll>
						{sorted.map((item) => (
							<Row
								key={item.id}
								item={item}
								maskSecrets={maskSecrets}
								unmasked={!!unmasked[item.id]}
								onToggleUnmask={() => toggleUnmask(item.id)}
							/>
						))}
					</ul>
				</>
			) : (
				<ul className="min-h-0 flex-1 list-none overflow-y-auto [scrollbar-width:none]" data-scroll>
					{sorted.map((item) => (
						<Row
							key={item.id}
							item={item}
							maskSecrets={maskSecrets}
							unmasked={!!unmasked[item.id]}
							onToggleUnmask={() => toggleUnmask(item.id)}
						/>
					))}
					{!items.length && (
						<li className="grid h-full place-items-center text-text-faint">
							<ClipboardIcon size={22} />
						</li>
					)}
				</ul>
			)}
		</div>
	);
}

/** Actions shared by rows and the hero, with a short confirmation. */
function useItemActions(item: ClipItem) {
	const island = useIsland();
	const askEnabled = useAskEnabled();
	const [done, setDone] = useState<"copied" | "kept" | null>(null);
	const timer = useRef<number | undefined>(undefined);
	const flash = (what: "copied" | "kept") => {
		setDone(what);
		window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => setDone(null), FEEDBACK_MS);
	};

	return {
		done,
		copy: () => clipAction("copy", item.id).then(() => flash("copied")),
		pin: () => clipAction("pin", item.id),
		keep: async () => {
			const paths = await clipAction<string[]>("keep", item.id);
			if (paths?.length) {
				await addToShelf(paths);
				flash("kept");
			}
		},
		// Left out while "Ask Claude" is turned off.
		ask: askEnabled
			? async () => {
					if (item.kind === "text") {
						const text = await clipAction<string>("text", item.id);
						if (text) draftRequest.set(text);
					} else if (item.kind === "image" && item.path) {
						await attachFiles([item.path]);
					} else {
						const paths = await clipAction<string[]>("keep", item.id);
						if (paths?.length) await attachFiles(paths);
					}
					requestAskFocus();
					island.expand("ask");
				}
			: undefined,
		open: () => clipAction("open", item.id),
		remove: () => clipAction("remove", item.id),
	};
}

/** Drag a picture or files out of the island to any app. */
function useDragOut(item: ClipItem) {
	const press = useRef<{ x: number; y: number; id: number } | null>(null);
	if (item.kind === "text") return {};
	return {
		onPointerDown: (e: PointerEvent) => {
			if (e.button !== 0 || (e.target as Element).closest("button")) return;
			press.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
		},
		onPointerMove: (e: PointerEvent) => {
			const p = press.current;
			if (!p || p.id !== e.pointerId || (e.buttons & 1) === 0) return;
			if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD) return;
			press.current = null;
			clipAction("drag", item.id);
		},
		onPointerUp: () => (press.current = null),
	};
}

function Visual({ item, size, isMasked }: { item: ClipItem; size: number; isMasked?: boolean }) {
	if (item.kind === "image" && item.thumb) {
		return (
			<img
				className="flex-none rounded-[7px] bg-white/6 object-cover"
				src={item.thumb}
				alt=""
				draggable={false}
				style={{ width: size, height: size }}
			/>
		);
	}
	return (
		<span
			className={cn(
				"grid flex-none place-items-center rounded-[9px]",
				isMasked ? "bg-[rgba(255,159,10,0.15)]" : "bg-white/7",
			)}
			style={{ width: size, height: size }}
		>
			{item.kind === "files" ? (
				<FolderIcon size={size * 0.42} color="#64D2FF" />
			) : isMasked ? (
				<LockIcon size={size * 0.42} color="#FF9F0A" />
			) : (
				<TextIcon size={size * 0.42} color={CLIPBOARD_YELLOW} />
			)}
		</span>
	);
}

function Meta({ item }: { item: ClipItem }) {
	const t = useT();
	const now = useNow(30_000);
	const parts = [
		item.kind === "text" && item.chars != null && item.chars > 40 ? t("clipboard.chars", { n: item.chars }) : null,
		item.kind === "files" && item.names.length > 1 ? item.names.slice(0, 3).join(", ") : null,
		item.source,
		formatAgo(t, item.copiedAt, now),
	].filter(Boolean);
	return <span className="truncate text-[11.5px] text-text-dim">{parts.join(" · ")}</span>;
}

function Row({
	item,
	maskSecrets,
	unmasked,
	onToggleUnmask,
}: {
	item: ClipItem;
	maskSecrets: boolean;
	unmasked: boolean;
	onToggleUnmask: () => void;
}) {
	const t = useT();
	const a = useItemActions(item);
	const drag = useDragOut(item);
	const secret = item.kind === "text" ? detectSecret(item.preview) : null;
	const isMasked = Boolean(maskSecrets && secret && !unmasked);

	return (
		<li
			className="group relative flex h-12 cursor-pointer items-center gap-2.5 rounded-xl px-2 hover:bg-white/6"
			title={t("clipboard.copy")}
			data-no-drag
			onClick={a.copy}
			{...drag}
		>
			<Visual item={item} size={36} isMasked={isMasked} />
			<div className="flex min-w-0 flex-1 flex-col gap-px">
				<div className="flex items-center gap-1.5 min-w-0">
					{item.pinned && (
						<span title={t("clipboard.pinned")} className="inline-flex">
							<PinIcon size={11} className="flex-none fill-[currentColor] text-[#FFD60A]" />
						</span>
					)}
					{isMasked ? (
						<span className="truncate text-[12.5px] font-mono tracking-wider text-[#FF9F0A]">
							••••••••••••••••{" "}
							<span className="font-sans text-[11px] font-normal text-text-dim">
								({t("clipboard.secretMasked", { type: secret?.label ?? "Secret" })})
							</span>
						</span>
					) : (
						<span className={cn("truncate text-[13px] font-semibold", item.kind === "text" && "font-medium")}>
							{clipTitle(t, item)}
						</span>
					)}
				</div>
				{a.done ? (
					<span className="truncate text-[11.5px] font-semibold text-[#30d158]">
						✓ {t(a.done === "copied" ? "clipboard.copiedAgain" : "clipboard.kept")}
					</span>
				) : (
					<Meta item={item} />
				)}
			</div>
			<div className="hidden gap-1 group-hover:flex">
				{secret && (
					<RowAction
						icon={isMasked ? <EyeIcon size={11} /> : <EyeOffIcon size={11} />}
						label={t(isMasked ? "clipboard.showSecret" : "clipboard.hideSecret")}
						onClick={onToggleUnmask}
					/>
				)}
				<RowAction
					icon={<PinIcon size={11} className={item.pinned ? "fill-[currentColor] text-[#FFD60A]" : ""} />}
					label={t(item.pinned ? "clipboard.unpin" : "clipboard.pin")}
					onClick={a.pin}
				/>
				{a.ask && <RowAction icon={<MessageCircleIcon size={11} />} label={t("clipboard.ask")} onClick={a.ask} />}
				{item.kind !== "text" && (
					<RowAction icon={<FolderIcon size={11} />} label={t("clipboard.keep")} onClick={a.keep} />
				)}
				<RowAction icon="×" label={t("clipboard.remove")} onClick={a.remove} />
			</div>
		</li>
	);
}

function Hero({ item }: { item: ClipItem }) {
	const t = useT();
	const a = useItemActions(item);
	const drag = useDragOut(item);

	return (
		<div className="flex h-29 flex-none cursor-grab gap-3.5 rounded-[14px] bg-card p-1.5" data-no-drag {...drag}>
			{item.thumb && (
				<img
					className="h-26 max-w-47.5 flex-none rounded-[9px] bg-white/4 object-contain"
					src={item.thumb}
					alt=""
					draggable={false}
				/>
			)}
			<div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
				<div className="flex items-center gap-1.5 min-w-0">
					{item.pinned && (
						<span title={t("clipboard.pinned")} className="inline-flex">
							<PinIcon size={11} className="flex-none fill-[currentColor] text-[#FFD60A]" />
						</span>
					)}
					<span className="truncate text-[13px] font-semibold">{clipTitle(t, item)}</span>
				</div>
				{a.done ? (
					<span className="truncate text-[11.5px] font-semibold text-[#30d158]">
						✓ {t(a.done === "copied" ? "clipboard.copiedAgain" : "clipboard.kept")}
					</span>
				) : (
					<Meta item={item} />
				)}
				<div className="mt-2 flex flex-wrap gap-1.5">
					<button
						type="button"
						className="inline-flex items-center gap-1.25 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold hover:bg-white/18"
						title={t("clipboard.copy")}
						onClick={a.copy}
					>
						<CopyIcon size={11} /> {t("clipboard.short.copy")}
					</button>
					<button
						type="button"
						className={cn(
							"inline-flex items-center gap-1.25 rounded-full px-2.5 py-1 text-[11.5px] font-semibold hover:bg-white/18",
							item.pinned ? "bg-[#FFD60A]/20 text-[#FFD60A]" : "bg-white/10",
						)}
						title={t(item.pinned ? "clipboard.unpin" : "clipboard.pin")}
						onClick={a.pin}
					>
						<PinIcon size={11} className={item.pinned ? "fill-[currentColor]" : ""} />{" "}
						{t(item.pinned ? "clipboard.unpin" : "clipboard.pin")}
					</button>
					{a.ask && (
						<button
							type="button"
							className="inline-flex items-center gap-1.25 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold hover:bg-white/18"
							title={t("clipboard.ask")}
							onClick={a.ask}
						>
							<MessageCircleIcon size={11} /> {t("clipboard.short.ask")}
						</button>
					)}
					<button
						type="button"
						className="inline-flex items-center gap-1.25 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold hover:bg-white/18"
						title={t("clipboard.keep")}
						onClick={a.keep}
					>
						<FolderIcon size={11} /> {t("clipboard.short.keep")}
					</button>
					<button
						type="button"
						className="inline-flex items-center gap-1.25 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold hover:bg-white/18"
						title={t("clipboard.open")}
						onClick={a.open}
					>
						<ExternalLinkIcon size={11} /> {t("clipboard.open")}
					</button>
				</div>
			</div>
		</div>
	);
}

function RowAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
	return (
		<button
			type="button"
			className="grid size-6 place-items-center rounded-full bg-[#3a3a3c] text-[14px] leading-none hover:bg-[#4a4a4e]"
			title={label}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
		>
			{icon}
		</button>
	);
}
