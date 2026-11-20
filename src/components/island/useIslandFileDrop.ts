import { useEffect, useRef } from "react";
import { draggingFiles } from "../../core/island";
import { useFileDrop } from "../../core/useFileDrop";
import type { IslandController } from "../../core/useIslandController";
import { attachFiles } from "../../modules/ask/store";
import { addToShelf } from "../../modules/shelf/actions";

const DRAG_LEAVE_GRACE_MS = 600;

/**
 * Files dragged over the island: the shelf opens to take them, unless "Ask
 * Claude" is open (then they become attachments). Drag-hold interaction
 * ensures smooth expansion without accidental collapse if pointer jitters.
 */
export function useIslandFileDrop(ctl: IslandController) {
	const live = useRef(ctl);
	live.current = ctl;
	const leaveTimer = useRef<number | undefined>(undefined);
	const asking = () => live.current.mode === "expanded" && live.current.tab === "ask";

	useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

	useFileDrop({
		onEnter: () => {
			window.clearTimeout(leaveTimer.current);
			draggingFiles.set(true);
			ctl.keepOpen(true, "files");
			if (asking()) ctl.expand();
			else ctl.expand("shelf");
		},
		onLeave: () => {
			window.clearTimeout(leaveTimer.current);
			// Drag-hold grace delay: prevents accidental collapse when dragging over borders or child elements
			leaveTimer.current = window.setTimeout(() => {
				draggingFiles.set(false);
				ctl.keepOpen(false, "files");
			}, DRAG_LEAVE_GRACE_MS);
		},
		onDrop: (paths) => {
			window.clearTimeout(leaveTimer.current);
			draggingFiles.set(false);
			const toAsk = asking();
			ctl.keepOpen(false, "files");
			if (toAsk) {
				attachFiles(paths);
			} else {
				addToShelf(paths);
				// Pointer still over the island: it stays open; otherwise a peek.
				ctl.peek("shelf");
			}
		},
	});
}
