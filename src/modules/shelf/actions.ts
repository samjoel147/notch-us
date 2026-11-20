import { providerAction } from "../../core/bridge";

export type ShelfItemKind = "folder" | "link" | "image" | "video" | "audio" | "document" | "archive" | "code" | "file";

/** Mirrors `Item` in `src-tauri/src/providers/shelf.rs`. */
export interface ShelfItem {
	path: string;
	name: string;
	isDir: boolean;
	ext: string;
	size: number;
	kind: ShelfItemKind;
	thumb: string | null;
	targetUrl?: string | null;
}

export interface ShelfState {
	items: ShelfItem[];
}

export const SHELF_PROVIDER = "shelf";

export const addToShelf = (paths: string[]) => providerAction(SHELF_PROVIDER, "add", paths);
export const shelfAction = (
	action: "remove" | "open" | "drag" | "reveal" | "copy_file" | "copy_path" | "clear",
	path?: string,
) => providerAction(SHELF_PROVIDER, action, path);
