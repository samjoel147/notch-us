import {
	CheckIcon,
	ClipboardIcon,
	CopyIcon,
	ExternalLinkIcon,
	EyeIcon,
	EyeOffIcon,
	FolderIcon,
	ImageIcon,
	LockIcon,
	MessageCircleIcon,
	PaletteIcon,
	PinIcon,
	SearchIcon,
	TextIcon,
	XIcon,
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

export interface ColorFormats {
	hex: string;
	rgb: string;
	hsl: string;
}

/** Detects and converts CSS color codes (HEX, RGB) into multi-format conversions. */
export function detectColorFormats(text: string | null | undefined): ColorFormats | null {
	if (!text) return null;
	const trimmed = text.trim();

	// HEX Match
	const hexMatch = trimmed.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
	if (hexMatch) {
		let c = hexMatch[1];
		if (c.length === 3) {
			c = c
				.split("")
				.map((x) => x + x)
				.join("");
		}
		const num = Number.parseInt(c, 16);
		const r = (num >> 16) & 255;
		const g = (num >> 8) & 255;
		const b = num & 255;
		return {
			hex: `#${c.toUpperCase()}`,
			rgb: `rgb(${r}, ${g}, ${b})`,
			hsl: rgbToHsl(r, g, b),
		};
	}

	// RGB Match
	const rgbMatch = trimmed.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
	if (rgbMatch) {
		const r = Math.min(255, Number.parseInt(rgbMatch[1], 10));
		const g = Math.min(255, Number.parseInt(rgbMatch[2], 10));
		const b = Math.min(255, Number.parseInt(rgbMatch[3], 10));
		const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
		return {
			hex,
			rgb: `rgb(${r}, ${g}, ${b})`,
			hsl: rgbToHsl(r, g, b),
		};
	}

	return null;
}

function rgbToHsl(r: number, g: number, b: number): string {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case rn:
				h = (gn - bn) / d + (gn < bn ? 6 : 0);
				break;
			case gn:
				h = (bn - rn) / d + 2;
				break;
			case bn:
				h = (rn - gn) / d + 4;
				break;
		}
		h /= 6;
	}

	return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

/** Detects CSS color codes (HEX, RGB, HSL) to display a live swatch. */
export function detectColor(text: string | null | undefined): string | null {
	if (!text) return null;
	const trimmed = text.trim();
	if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) return trimmed;
	if (/^(rgb|hsl)a?\([^)]+\)$/i.test(trimmed)) return trimmed;
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
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState<"all" | "text" | "image" | "files" | "color">("all");

	const toggleUnmask = (id: number) => {
		setUnmasked((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	const items = state?.items ?? [];
	const heroItem = hero && items[0]?.kind === "image" ? items[0] : null;
	const listItems = heroItem ? items.slice(1) : items;
	const sorted = [...listItems].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

	const filtered = sorted.filter((item) => {
		if (category === "color") {
			if (item.kind !== "text" || !detectColor(item.preview)) return false;
		} else if (category !== "all" && item.kind !== category) {
			return false;
		}

		if (!search.trim()) return true;
		const q = search.toLowerCase();
		if (item.preview?.toLowerCase().includes(q)) return true;
		if (item.source?.toLowerCase().includes(q)) return true;
		if (item.kind === "files" && item.names.some((n) => n.toLowerCase().includes(q))) return true;
		return false;
	});

	return (
		<div className="flex h-full flex-col gap-2 select-none" onClick={(e) => e.stopPropagation()}>
			{/* Top Bar: Hint / Clear & Count */}
			<div className="flex items-center justify-between gap-3 px-1">
				<span className="text-[12px] font-medium text-text-dim">
					{items.length ? t("clipboard.hint") : t("clipboard.empty")}
				</span>
				{items.length > 0 && (
					<TextButton onClick={() => providerAction(CLIPBOARD_PROVIDER, "clear")}>{t("clipboard.clear")}</TextButton>
				)}
			</div>

			{/* Search & Category Filter Header */}
			{items.length > 0 && (
				<div className="flex items-center gap-2 px-0.5">
					<div className="relative flex-1 flex items-center">
						<SearchIcon size={12} className="absolute left-2.5 text-text-faint pointer-events-none" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t("clipboard.searchPlaceholder")}
							className="h-7.5 w-full rounded-xl bg-white/[0.05] dark:bg-white/[0.04] border border-hairline/80 backdrop-blur-md pl-7.5 pr-6 text-[11.5px] text-text placeholder:text-text-faint focus:border-cyan-400/50 focus:outline-hidden transition-colors"
						/>
						{search && (
							<button
								type="button"
								onClick={() => setSearch("")}
								className="absolute right-2 text-text-faint hover:text-text cursor-pointer"
							>
								<XIcon size={11} />
							</button>
						)}
					</div>

					{/* Category Filter Chips */}
					<div className="flex items-center gap-1">
						{(
							[
								{ id: "all", label: "All" },
								{ id: "text", label: "Text", icon: <TextIcon size={10} /> },
								{ id: "image", label: "Images", icon: <ImageIcon size={10} /> },
								{ id: "files", label: "Files", icon: <FolderIcon size={10} /> },
								{ id: "color", label: "Colors", icon: <PaletteIcon size={10} /> },
							] as const
						).map((cat) => (
							<button
								key={cat.id}
								type="button"
								className={cn(
									"inline-flex items-center gap-1 h-7 rounded-lg px-2 text-[10.5px] font-semibold transition-all cursor-pointer border",
									category === cat.id
										? "border-cyan-400/40 bg-cyan-400/15 text-cyan-400 shadow-xs"
										: "border-hairline/80 bg-white/[0.04] text-text-dim hover:bg-white/[0.08] hover:text-text",
								)}
								onClick={() => setCategory(cat.id)}
							>
								{"icon" in cat && cat.icon}
								<span>{cat.label}</span>
							</button>
						))}
					</div>
				</div>
			)}

			{/* List Body */}
			{heroItem ? (
				<>
					<Hero item={heroItem} />
					<ul className="min-h-0 flex-1 list-none overflow-y-auto [scrollbar-width:none]" data-scroll>
						{filtered.map((item) => (
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
					{filtered.map((item) => (
						<Row
							key={item.id}
							item={item}
							maskSecrets={maskSecrets}
							unmasked={!!unmasked[item.id]}
							onToggleUnmask={() => toggleUnmask(item.id)}
						/>
					))}
					{!items.length && (
						<li className="grid h-full place-items-center text-text-faint py-8">
							<ClipboardIcon size={26} className="opacity-50" />
						</li>
					)}
					{items.length > 0 && filtered.length === 0 && (
						<li className="grid h-24 place-items-center text-[12px] text-text-dim">{t("clipboard.noResults")}</li>
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
	const [done, setDone] = useState<string | null>(null);
	const timer = useRef<number | undefined>(undefined);
	const flash = (what: string) => {
		setDone(what);
		window.clearTimeout(timer.current);
		timer.current = window.setTimeout(() => setDone(null), FEEDBACK_MS);
	};

	return {
		done,
		copy: () => clipAction("copy", item.id).then(() => flash("copied")),
		copyCustom: async (text: string, label: string) => {
			try {
				await navigator.clipboard.writeText(text);
				flash(label);
			} catch {
				clipAction("copy", item.id).then(() => flash("copied"));
			}
		},
		pin: () => clipAction("pin", item.id),
		keep: async () => {
			const paths = await clipAction<string[]>("keep", item.id);
			if (paths?.length) {
				await addToShelf(paths);
				flash("kept");
			}
		},
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
	const [hovered, setHovered] = useState(false);

	if (item.kind === "image" && item.thumb) {
		return (
			<div className="relative flex-none" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
				<img
					className="flex-none rounded-[8px] bg-white/6 object-cover border border-white/10"
					src={item.thumb}
					alt=""
					draggable={false}
					style={{ width: size, height: size }}
				/>

				{/* Floating Magnified Image Popover on Hover */}
				{hovered && (
					<div className="absolute left-10 -top-12 z-50 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/20 p-1.5 shadow-2xl pointer-events-none">
						<img className="max-h-48 max-w-64 rounded-xl object-contain" src={item.thumb} alt="" draggable={false} />
					</div>
				)}
			</div>
		);
	}
	const color = item.kind === "text" && !isMasked ? detectColor(item.preview) : null;
	if (color) {
		return (
			<span
				className="flex-none rounded-[8px] border border-white/20 shadow-xs ring-1 ring-black/10"
				style={{ width: size, height: size, backgroundColor: color }}
				title={color}
			/>
		);
	}
	return (
		<span
			className={cn(
				"grid flex-none place-items-center rounded-[8px]",
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
	const colorFormats = item.kind === "text" && !isMasked ? detectColorFormats(item.preview) : null;

	return (
		<li
			className="group relative flex h-12 cursor-pointer items-center gap-2.5 rounded-xl px-2.5 transition-all duration-150 hover:bg-white/[0.07] dark:hover:bg-white/[0.05]"
			title={t("clipboard.copy")}
			data-no-drag
			onClick={a.copy}
			{...drag}
		>
			<Visual item={item} size={36} isMasked={isMasked} />
			<div className="flex min-w-0 flex-1 flex-col gap-px">
				<div className="flex items-center gap-1.5 min-w-0">
					{item.pinned && (
						<span
							title={t("clipboard.pinned")}
							className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-[#FFD60A]/15 border border-[#FFD60A]/30 text-[#FFD60A] text-[9px] font-bold"
						>
							<PinIcon size={9} className="flex-none fill-[currentColor]" />
							<span>PIN</span>
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
					<span className="inline-flex items-center gap-1 truncate text-[11.5px] font-semibold text-[#30d158]">
						<CheckIcon size={12} className="shrink-0" />
						<span>
							{a.done === "copied"
								? t("clipboard.copiedAgain")
								: a.done === "kept"
									? t("clipboard.kept")
									: `Copied ${a.done}!`}
						</span>
					</span>
				) : (
					<div className="flex items-center gap-2">
						<Meta item={item} />
						{/* Multi-Format Color Conversion Chips */}
						{colorFormats && (
							<div
								className="flex items-center gap-1"
								onClick={(e) => e.stopPropagation()}
								onKeyDown={(e) => e.stopPropagation()}
							>
								<button
									type="button"
									onClick={() => a.copyCustom(colorFormats.hex, "HEX")}
									className="rounded-md bg-white/10 hover:bg-white/20 px-1.5 py-0.2 text-[9.5px] font-bold text-text-dim hover:text-text transition-colors"
								>
									HEX
								</button>
								<button
									type="button"
									onClick={() => a.copyCustom(colorFormats.rgb, "RGB")}
									className="rounded-md bg-white/10 hover:bg-white/20 px-1.5 py-0.2 text-[9.5px] font-bold text-text-dim hover:text-text transition-colors"
								>
									RGB
								</button>
								<button
									type="button"
									onClick={() => a.copyCustom(colorFormats.hsl, "HSL")}
									className="rounded-md bg-white/10 hover:bg-white/20 px-1.5 py-0.2 text-[9.5px] font-bold text-text-dim hover:text-text transition-colors"
								>
									HSL
								</button>
							</div>
						)}
					</div>
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
				<RowAction icon={<XIcon size={11} />} label={t("clipboard.remove")} onClick={a.remove} />
			</div>
		</li>
	);
}

function Hero({ item }: { item: ClipItem }) {
	const t = useT();
	const a = useItemActions(item);
	const drag = useDragOut(item);

	return (
		<div
			className="flex h-29 flex-none cursor-grab gap-3.5 rounded-[16px] bg-card/80 dark:bg-white/[0.04] backdrop-blur-xl border border-hairline/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_16px_rgba(0,0,0,0.15)] p-2"
			data-no-drag
			{...drag}
		>
			{item.thumb && (
				<img
					className="h-25 max-w-48 flex-none rounded-[10px] bg-white/4 object-contain border border-white/10"
					src={item.thumb}
					alt=""
					draggable={false}
				/>
			)}
			<div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
				<div className="flex items-center gap-1.5 min-w-0">
					{item.pinned && (
						<span
							title={t("clipboard.pinned")}
							className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-[#FFD60A]/15 border border-[#FFD60A]/30 text-[#FFD60A] text-[9px] font-bold"
						>
							<PinIcon size={9} className="flex-none fill-[currentColor]" />
							<span>PIN</span>
						</span>
					)}
					<span className="truncate text-[13px] font-semibold">{clipTitle(t, item)}</span>
				</div>
				{a.done ? (
					<span className="inline-flex items-center gap-1 truncate text-[11.5px] font-semibold text-[#30d158]">
						<CheckIcon size={12} className="shrink-0" />
						<span>{t(a.done === "copied" ? "clipboard.copiedAgain" : "clipboard.kept")}</span>
					</span>
				) : (
					<Meta item={item} />
				)}
				<div className="mt-2 flex flex-wrap gap-1.5">
					<button
						type="button"
						className="inline-flex items-center gap-1.25 rounded-full bg-white/10 hover:bg-white/18 px-2.5 py-1 text-[11.5px] font-semibold transition-all cursor-pointer"
						title={t("clipboard.copy")}
						onClick={a.copy}
					>
						<CopyIcon size={11} /> {t("clipboard.short.copy")}
					</button>
					<button
						type="button"
						className={cn(
							"inline-flex items-center gap-1.25 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-all cursor-pointer",
							item.pinned ? "bg-[#FFD60A]/20 text-[#FFD60A]" : "bg-white/10 hover:bg-white/18",
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
							className="inline-flex items-center gap-1.25 rounded-full bg-white/10 hover:bg-white/18 px-2.5 py-1 text-[11.5px] font-semibold transition-all cursor-pointer"
							title={t("clipboard.ask")}
							onClick={a.ask}
						>
							<MessageCircleIcon size={11} /> {t("clipboard.short.ask")}
						</button>
					)}
					<button
						type="button"
						className="inline-flex items-center gap-1.25 rounded-full bg-white/10 hover:bg-white/18 px-2.5 py-1 text-[11.5px] font-semibold transition-all cursor-pointer"
						title={t("clipboard.keep")}
						onClick={a.keep}
					>
						<FolderIcon size={11} /> {t("clipboard.short.keep")}
					</button>
					<button
						type="button"
						className="inline-flex items-center gap-1.25 rounded-full bg-white/10 hover:bg-white/18 px-2.5 py-1 text-[11.5px] font-semibold transition-all cursor-pointer"
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
			className="grid size-6.5 place-items-center rounded-lg bg-white/10 dark:bg-white/[0.08] hover:bg-white/20 border border-white/10 text-text-dim hover:text-text transition-all active:scale-95 cursor-pointer"
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
