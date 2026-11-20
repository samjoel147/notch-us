import {
	ArchiveIcon,
	CheckIcon,
	CopyIcon,
	DownloadIcon,
	ExternalLinkIcon,
	FileCodeIcon,
	FileIcon,
	FilesIcon,
	FileTextIcon,
	FilmIcon,
	FolderIcon,
	FolderSearchIcon,
	GlobeIcon,
	ImageIcon,
	LayoutGridIcon,
	ListIcon,
	MessageCircleIcon,
	MusicIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { TextButton } from "../../../components/ui/button";
import { providerAction } from "../../../core/bridge";
import { cn } from "../../../core/cn";
import { useT } from "../../../core/i18n";
import { draggingFiles, useIsland } from "../../../core/island";
import { attachFiles, requestAskFocus, useAskEnabled } from "../../ask/store";
import { SHELF_PROVIDER, type ShelfItem, type ShelfState, shelfAction } from "../actions";

const DRAG_THRESHOLD = 5;
const VIEW_MODE_KEY = "island.shelf.viewMode";

function formatBytes(bytes: number): string {
	if (!bytes || bytes <= 0 || !Number.isFinite(bytes)) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function getKindLabel(item: ShelfItem): string {
	if (item.isDir) return "Folder";
	if (item.kind === "link") return "Web Link";
	if (item.kind === "image") return `${item.ext.toUpperCase()} Image`;
	if (item.kind === "video") return `${item.ext.toUpperCase()} Video`;
	if (item.kind === "audio") return `${item.ext.toUpperCase()} Audio`;
	if (item.kind === "document") return `${item.ext.toUpperCase()} Doc`;
	if (item.kind === "archive") return `${item.ext.toUpperCase()} Archive`;
	if (item.kind === "code") return `${item.ext.toUpperCase()} Source`;
	return item.ext ? `${item.ext.toUpperCase()} File` : "File";
}

function cleanItemName(item: ShelfItem): string {
	if (!item.name) return "Unnamed file";
	const normalized = item.name.replace(/\\/g, "/");
	return normalized.split("/").pop() || item.name;
}

/** Files dropped on the island; drag them out to any app, double-click to open. */
export function ShelfPanel({ state }: { state: ShelfState | undefined }) {
	const t = useT();
	const dragging = draggingFiles.use();
	const items = state?.items ?? [];
	const [allCopied, setAllCopied] = useState(false);
	const allCopyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [viewMode, setViewModeState] = useState<"grid" | "list">(() => {
		try {
			const saved = localStorage.getItem(VIEW_MODE_KEY);
			return saved === "list" ? "list" : "grid";
		} catch {
			return "grid";
		}
	});

	useEffect(() => {
		return () => {
			if (allCopyTimer.current) clearTimeout(allCopyTimer.current);
		};
	}, []);

	const setViewMode = (mode: "grid" | "list") => {
		setViewModeState(mode);
		try {
			localStorage.setItem(VIEW_MODE_KEY, mode);
		} catch {
			// Storage quota or permission blocked
		}
	};

	const totalBytes = items.reduce((acc, it) => acc + (it.size || 0), 0);

	const copyAllPaths = async () => {
		if (items.length === 0) return;
		const paths = items.map((it) => it.targetUrl || it.path).join("\n");
		try {
			await navigator.clipboard.writeText(paths);
			setAllCopied(true);
			if (allCopyTimer.current) clearTimeout(allCopyTimer.current);
			allCopyTimer.current = setTimeout(() => setAllCopied(false), 1600);
		} catch (e) {
			console.warn("Failed to copy all paths:", e);
		}
	};

	return (
		<div className="flex h-full flex-col gap-2 p-1 select-none" onClick={(e) => e.stopPropagation()}>
			{/* Header: Item Count, Staged Size & Actions */}
			<div className="flex items-center justify-between gap-3 px-1.5">
				<div className="flex items-center gap-2">
					<span className="text-[12.5px] font-bold text-text">
						{items.length === 1 ? t("shelf.itemCountOne") : t("shelf.itemCount", { n: items.length })}
					</span>
					{items.length > 0 && totalBytes > 0 && (
						<span className="text-[11px] font-medium text-text-faint tabular-nums">· {formatBytes(totalBytes)}</span>
					)}
					<span className="hidden sm:inline text-[11px] text-text-dim">· {t("shelf.hint")}</span>
				</div>

				<div className="flex items-center gap-2">
					{/* Batch "Copy All Paths" Button */}
					{items.length > 1 && (
						<button
							type="button"
							onClick={copyAllPaths}
							className={cn(
								"inline-flex items-center gap-1.5 h-7 rounded-lg px-2.5 text-[11px] font-semibold transition-all border cursor-pointer",
								allCopied
									? "border-emerald-400/40 bg-emerald-400/15 text-emerald-400 shadow-xs"
									: "border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-text-dim hover:text-text",
							)}
						>
							{allCopied ? <CheckIcon size={12} /> : <CopyIcon size={11} />}
							<span>{allCopied ? t("shelf.pathsCopied") : t("shelf.copyAllPaths")}</span>
						</button>
					)}

					{/* Grid / List View Toggle */}
					<div className="flex items-center rounded-lg bg-white/[0.05] dark:bg-white/[0.04] p-0.5 border border-hairline/80 backdrop-blur-md">
						<button
							type="button"
							className={cn(
								"grid size-6 place-items-center rounded-md text-text-dim transition-all cursor-pointer",
								viewMode === "grid" && "bg-white/15 text-text shadow-xs border border-white/10",
							)}
							title={t("shelf.viewGrid")}
							onClick={() => setViewMode("grid")}
						>
							<LayoutGridIcon size={13} />
						</button>
						<button
							type="button"
							className={cn(
								"grid size-6 place-items-center rounded-md text-text-dim transition-all cursor-pointer",
								viewMode === "list" && "bg-white/15 text-text shadow-xs border border-white/10",
							)}
							title={t("shelf.viewList")}
							onClick={() => setViewMode("list")}
						>
							<ListIcon size={13} />
						</button>
					</div>

					{items.length > 0 && (
						<TextButton
							onClick={() => providerAction(SHELF_PROVIDER, "clear")}
							className="flex items-center gap-1 text-[11.5px] text-red-400 hover:text-red-300"
							title={t("shelf.clear")}
						>
							<Trash2Icon size={12} />
							<span>{t("shelf.clear")}</span>
						</TextButton>
					)}
				</div>
			</div>

			{/* Main Dropzone / Items Container */}
			<div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-card/75 dark:bg-white/[0.035] backdrop-blur-xl border border-hairline/80 dark:border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
				{/* Elastic VisionOS Drop Target Overlay */}
				{dragging && (
					<div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#64D2FF]/12 backdrop-blur-md border-2 border-dashed border-[#64D2FF] shadow-[inset_0_0_32px_rgba(100,210,255,0.35)] animate-pulse">
						<div className="grid size-14 place-items-center rounded-2xl bg-[#64D2FF]/20 shadow-lg border border-[#64D2FF]/40">
							<DownloadIcon size={32} className="text-[#64D2FF] animate-bounce" />
						</div>
						<span className="text-[13px] font-bold text-text tracking-wide drop-shadow-md">
							{t("shelf.dropOverlay")}
						</span>
					</div>
				)}

				{items.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-2.5 text-text-dim py-8">
						<div className="grid size-13 place-items-center rounded-2xl bg-white/[0.05] border border-white/10 text-[#64D2FF] shadow-inner">
							<DownloadIcon size={26} />
						</div>
						<span className="text-[13px] font-semibold text-text">{t("shelf.empty")}</span>
						<span className="text-[11px] text-text-dim">{t("shelf.dropOverlay")}</span>
					</div>
				) : (
					<div
						className={cn(
							"h-full overflow-y-auto p-2.5 [scrollbar-width:none]",
							viewMode === "grid" ? "grid grid-cols-4 gap-2.5 content-start" : "flex flex-col gap-1.5",
						)}
						data-scroll
					>
						{items.map((item) =>
							viewMode === "grid" ? <GridCard key={item.path} item={item} /> : <ListRow key={item.path} item={item} />,
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function GridCard({ item }: { item: ShelfItem }) {
	const t = useT();
	const island = useIsland();
	const askEnabled = useAskEnabled();
	const press = useRef<{ x: number; y: number; id: number } | null>(null);
	const [copied, setCopied] = useState<"file" | "path" | null>(null);
	const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (copyTimer.current) clearTimeout(copyTimer.current);
		};
	}, []);

	const onPointerDown = (e: PointerEvent) => {
		if (e.button !== 0 || (e.target as Element).closest("button")) return;
		e.stopPropagation();
		press.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
	};

	const onPointerMove = (e: PointerEvent) => {
		const p = press.current;
		if (!p || p.id !== e.pointerId || (e.buttons & 1) === 0) return;
		if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD) return;
		press.current = null;
		shelfAction("drag", item.path);
	};

	const copyFile = (e: React.MouseEvent) => {
		e.stopPropagation();
		shelfAction("copy_file", item.path);
		setCopied("file");
		if (copyTimer.current) clearTimeout(copyTimer.current);
		copyTimer.current = setTimeout(() => setCopied(null), 1500);
	};

	const copyPath = (e: React.MouseEvent) => {
		e.stopPropagation();
		navigator.clipboard.writeText(item.targetUrl || item.path);
		shelfAction("copy_path", item.path);
		setCopied("path");
		if (copyTimer.current) clearTimeout(copyTimer.current);
		copyTimer.current = setTimeout(() => setCopied(null), 1500);
	};

	const reveal = (e: React.MouseEvent) => {
		e.stopPropagation();
		shelfAction("reveal", item.path);
	};

	const open = (e: React.MouseEvent) => {
		e.stopPropagation();
		shelfAction("open", item.path);
	};

	const remove = (e: React.MouseEvent) => {
		e.stopPropagation();
		shelfAction("remove", item.path);
	};

	return (
		<div
			className="group relative flex flex-col items-center justify-between p-2.5 rounded-2xl bg-white/[0.04] dark:bg-white/[0.035] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#64D2FF]/40 cursor-grab transition-all duration-200 select-none overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.12)]"
			title={item.path}
			data-no-drag
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={() => (press.current = null)}
			onDoubleClick={open}
		>
			{/* Preview */}
			<div className="relative grid size-12 place-items-center mb-1.5 transition-transform duration-200 group-hover:scale-95">
				{item.thumb ? (
					<img
						src={item.thumb}
						alt=""
						className="size-12 rounded-xl object-cover shadow-sm border border-white/10"
						draggable={false}
					/>
				) : (
					<ItemKindIcon item={item} />
				)}
			</div>

			{/* Label & Metadata */}
			<div className="flex w-full flex-col items-center text-center">
				<span className="line-clamp-1 w-full text-[11.5px] font-semibold text-text" title={item.name}>
					{cleanItemName(item)}
				</span>
				<span className="text-[10px] font-medium text-text-dim mt-0.5 tabular-nums">
					{item.isDir ? "Folder" : formatBytes(item.size)}
				</span>
			</div>

			{/* Top corner actions: Ask Claude (left) & Remove (right) */}
			<div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between pointer-events-none z-10">
				{askEnabled ? (
					<ActionButton
						title={t("shelf.ask")}
						onClick={(e) => {
							e.stopPropagation();
							attachFiles([item.path]);
							requestAskFocus();
							island.expand("ask");
						}}
						className="pointer-events-auto opacity-0 group-hover:opacity-100 size-5 text-white/80 hover:text-white bg-black/60 hover:bg-black/85 backdrop-blur-sm shadow-xs transition-opacity"
					>
						<MessageCircleIcon size={10} />
					</ActionButton>
				) : (
					<span />
				)}
				<ActionButton
					title={t("shelf.remove")}
					onClick={remove}
					className="pointer-events-auto opacity-0 group-hover:opacity-100 size-5 text-red-400 hover:text-red-300 bg-black/60 hover:bg-black/85 backdrop-blur-sm shadow-xs transition-opacity"
				>
					<XIcon size={11} />
				</ActionButton>
			</div>

			{/* Bottom action dock overlay */}
			<div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-center gap-1 p-1 rounded-xl bg-black/85 backdrop-blur-xl border border-white/15 shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto z-10">
				{copied ? (
					<div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-[#64D2FF] py-0.5">
						<CheckIcon size={11} />
						<span>{t("shelf.copied")}</span>
					</div>
				) : (
					<>
						<ActionButton title={t("shelf.copyFile")} onClick={copyFile} className="size-5.5">
							<FilesIcon size={10} />
						</ActionButton>
						<ActionButton title={t("shelf.copyPath")} onClick={copyPath} className="size-5.5">
							<CopyIcon size={10} />
						</ActionButton>
						<ActionButton title={t("shelf.openFile")} onClick={open} className="size-5.5">
							<ExternalLinkIcon size={10} />
						</ActionButton>
						<ActionButton title={t("shelf.showInFolder")} onClick={reveal} className="size-5.5">
							<FolderSearchIcon size={10} />
						</ActionButton>
					</>
				)}
			</div>
		</div>
	);
}

function ListRow({ item }: { item: ShelfItem }) {
	const t = useT();
	const island = useIsland();
	const askEnabled = useAskEnabled();
	const press = useRef<{ x: number; y: number; id: number } | null>(null);
	const [copied, setCopied] = useState<"file" | "path" | null>(null);
	const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (copyTimer.current) clearTimeout(copyTimer.current);
		};
	}, []);

	const onPointerDown = (e: PointerEvent) => {
		if (e.button !== 0 || (e.target as Element).closest("button")) return;
		e.stopPropagation();
		press.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
	};

	const onPointerMove = (e: PointerEvent) => {
		const p = press.current;
		if (!p || p.id !== e.pointerId || (e.buttons & 1) === 0) return;
		if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD) return;
		press.current = null;
		shelfAction("drag", item.path);
	};

	const copyFile = (e: React.MouseEvent) => {
		e.stopPropagation();
		shelfAction("copy_file", item.path);
		setCopied("file");
		if (copyTimer.current) clearTimeout(copyTimer.current);
		copyTimer.current = setTimeout(() => setCopied(null), 1500);
	};

	const copyPath = (e: React.MouseEvent) => {
		e.stopPropagation();
		navigator.clipboard.writeText(item.targetUrl || item.path);
		shelfAction("copy_path", item.path);
		setCopied("path");
		if (copyTimer.current) clearTimeout(copyTimer.current);
		copyTimer.current = setTimeout(() => setCopied(null), 1500);
	};

	const reveal = (e: React.MouseEvent) => {
		e.stopPropagation();
		shelfAction("reveal", item.path);
	};

	const open = (e: React.MouseEvent) => {
		e.stopPropagation();
		shelfAction("open", item.path);
	};

	const remove = (e: React.MouseEvent) => {
		e.stopPropagation();
		shelfAction("remove", item.path);
	};

	return (
		<div
			className="group flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.035] dark:bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/[0.14] cursor-grab transition-all select-none shadow-xs"
			title={item.path}
			data-no-drag
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={() => (press.current = null)}
			onDoubleClick={open}
		>
			{/* Left: Thumbnail & Details */}
			<div className="flex items-center gap-2.5 min-w-0 flex-1">
				<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-card border border-white/10 overflow-hidden">
					{item.thumb ? (
						<img src={item.thumb} alt="" className="size-full object-cover" draggable={false} />
					) : (
						<ItemKindIcon item={item} size={18} />
					)}
				</div>
				<div className="flex flex-col min-w-0 flex-1">
					<span className="truncate text-[12px] font-semibold text-text" title={item.name}>
						{cleanItemName(item)}
					</span>
					<div className="flex items-center gap-1.5 text-[10.5px] text-text-dim">
						<span className="tabular-nums">{item.isDir ? "Folder" : formatBytes(item.size)}</span>
						<span>•</span>
						<span>{getKindLabel(item)}</span>
					</div>
				</div>
			</div>

			{/* Right: Quick Action Buttons */}
			<div className="flex items-center gap-1 shrink-0">
				{copied && (
					<span className="flex items-center gap-1 text-[11px] font-semibold text-[#64D2FF] mr-1">
						<CheckIcon size={12} />
						{t("shelf.copied")}
					</span>
				)}
				<ActionButton title={t("shelf.copyFile")} onClick={copyFile}>
					<FilesIcon size={12} />
				</ActionButton>
				<ActionButton title={t("shelf.copyPath")} onClick={copyPath}>
					<CopyIcon size={12} />
				</ActionButton>
				<ActionButton title={t("shelf.openFile")} onClick={open}>
					<ExternalLinkIcon size={12} />
				</ActionButton>
				<ActionButton title={t("shelf.showInFolder")} onClick={reveal}>
					<FolderSearchIcon size={12} />
				</ActionButton>
				{askEnabled && (
					<ActionButton
						title={t("shelf.ask")}
						onClick={() => {
							attachFiles([item.path]);
							requestAskFocus();
							island.expand("ask");
						}}
					>
						<MessageCircleIcon size={12} />
					</ActionButton>
				)}
				<ActionButton title={t("shelf.remove")} onClick={remove} className="text-red-400 hover:text-red-300">
					<XIcon size={12} />
				</ActionButton>
			</div>
		</div>
	);
}

function ActionButton({
	children,
	title,
	onClick,
	className,
}: {
	children: ReactNode;
	title: string;
	onClick: (e: React.MouseEvent) => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			className={cn(
				"grid size-6 place-items-center rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all active:scale-95 cursor-pointer",
				className,
			)}
			title={title}
			onClick={onClick}
		>
			{children}
		</button>
	);
}

function ItemKindIcon({ item, size = 24 }: { item: ShelfItem; size?: number }) {
	if (item.isDir) return <FolderIcon size={size} className="text-[#64D2FF]" />;
	if (item.kind === "link") return <GlobeIcon size={size} className="text-purple-400" />;
	if (item.kind === "video") return <FilmIcon size={size} className="text-amber-400" />;
	if (item.kind === "audio") return <MusicIcon size={size} className="text-rose-400" />;
	if (item.kind === "code") return <FileCodeIcon size={size} className="text-emerald-400" />;
	if (item.kind === "archive") return <ArchiveIcon size={size} className="text-amber-500" />;
	if (item.kind === "image") return <ImageIcon size={size} className="text-sky-400" />;
	if (item.kind === "document") return <FileTextIcon size={size} className="text-rose-400" />;

	return (
		<span className="relative flex flex-col items-center justify-center">
			<FileIcon size={size} className="text-slate-300" />
			{item.ext && (
				<span className="absolute -bottom-1 rounded-[2px] bg-[#0a84ff] px-0.5 text-[7px] font-bold text-white uppercase tracking-tighter">
					{item.ext.slice(0, 3)}
				</span>
			)}
		</span>
	);
}
