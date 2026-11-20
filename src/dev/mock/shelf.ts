import type { ShelfItem } from "../../modules/shelf/actions";
import { art, defineMock, provider } from "./kit";

const fromPath = (
	path: string,
	options: { size?: number; kind?: ShelfItem["kind"]; thumb?: string | null; isDir?: boolean } = {},
): ShelfItem => {
	const normalized = path.replace(/\\/g, "/");
	const name = normalized.split("/").pop() ?? path;
	const dot = name.lastIndexOf(".");
	const isDir = options.isDir ?? dot < 1;
	const ext = isDir ? "" : name.slice(dot + 1).toLowerCase();
	return {
		path,
		name,
		isDir,
		ext,
		size: isDir ? 0 : (options.size ?? 2_450_000),
		kind: isDir
			? "folder"
			: (options.kind ?? (ext === "png" || ext === "jpg" ? "image" : ext === "pdf" ? "document" : "file")),
		thumb: options.thumb ?? null,
	};
};

const state = provider("shelf", {
	items: [
		fromPath("C:/Users/Alex/Documents/Quarterly_Report.pdf", { size: 3_820_000, kind: "document" }),
		fromPath("C:/Users/Alex/Pictures/Wallpapers", { isDir: true }),
		fromPath("C:/Users/Alex/Design/Cover_Asset.png", { size: 5_120_000, kind: "image", thumb: art }),
	],
});

export const shelf = defineMock({
	label: "Shelf",
	start: () => state.publish(),
	controls: [
		{
			kind: "button",
			label: "Add file",
			run: () =>
				state.set((s) => ({
					items: [...s.items, fromPath(`C:/Users/Alex/Downloads/file-${s.items.length + 1}.zip`)],
				})),
		},
	],
	actions: {
		shelf: {
			add: (paths) => state.set((s) => ({ items: [...s.items, ...(paths as string[]).map((p) => fromPath(p))] })),
			remove: (path) => state.set((s) => ({ items: s.items.filter((i) => i.path !== path) })),
			clear: () => state.set({ items: [] }),
		},
	},
});

export const setShelf = state.set;
