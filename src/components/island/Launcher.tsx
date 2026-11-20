import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { useT } from "../../core/i18n";
import type { ModuleEntry } from "../../core/types";

/** Launcher grid: tiles per row, tile height and gap (px). */
const LAUNCHER_COLS = 4;
const TILE_H = 74;
const TILE_GAP = 9;

export function launcherSize(count: number) {
	const rows = Math.max(1, Math.ceil(count / LAUNCHER_COLS));
	return { width: 560, height: 32 + rows * TILE_H + (rows - 1) * TILE_GAP };
}

/** Every enabled module as an elevated VisionOS app card with a squircle icon badge. */
export function Launcher({ entries, onSelect }: { entries: ModuleEntry[]; onSelect: (id: string) => void }) {
	const t = useT();
	return (
		<div
			className="grid h-full"
			style={{ gridTemplateColumns: `repeat(${LAUNCHER_COLS}, 1fr)`, gridAutoRows: TILE_H, gap: TILE_GAP }}
		>
			{entries.map(({ module, view }, i) => (
				<motion.button
					key={module.id}
					className="group relative flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-[18px] bg-card p-2 text-text-dim border border-hairline shadow-xs hover:border-[var(--tab-accent)]/50 hover:text-text hover:shadow-md transition-all duration-200 cursor-pointer"
					style={{ "--tab-accent": view.accent ?? "#fff" } as CSSProperties}
					whileHover={{ y: -2, scale: 1.02 }}
					whileTap={{ scale: 0.96 }}
					initial={{ opacity: 0, scale: 0.92 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.02 * i, type: "spring", stiffness: 420, damping: 28 }}
					onClick={(e) => {
						e.stopPropagation();
						onSelect(module.id);
					}}
				>
					<div
						className="relative flex size-7 items-center justify-center transition-transform duration-200 group-hover:scale-110"
						style={{ "--icon-accent": view.accent } as CSSProperties}
					>
						<span className="grid size-6 place-items-center text-[var(--icon-accent,var(--text))] [&_svg]:size-5 [&_img]:size-6 [&_img]:rounded-md">
							{view.icon}
						</span>
						{view.active && (
							<span className="absolute -top-1 -right-1 size-2 rounded-full bg-ok shadow-[0_0_0_1.5px_var(--island,#000)] animate-pulse" />
						)}
					</div>
					<span className="max-w-full truncate text-[11.5px] font-semibold tracking-tight">{t(module.title)}</span>
				</motion.button>
			))}
		</div>
	);
}
