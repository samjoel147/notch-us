import { LayoutGridIcon, PinIcon, SettingsIcon } from "lucide-react";
import { motion, type Transition } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { tv } from "tailwind-variants";
import { command } from "../../core/bridge";
import { useT } from "../../core/i18n";
import type { ModuleEntry } from "../../core/types";
import { LAUNCHER } from "../../core/useIslandController";

const tabs = tv({
	slots: {
		/** Base row holding the dock capsule and floating edge action buttons. */
		base: "relative mb-2.5 flex items-center gap-1.5 pr-9.5",
		capsule: "flex items-center gap-1",
		tab: "relative flex h-7.5 items-center gap-1.75 rounded-[15px] pr-3 pl-2 text-[13px] font-semibold text-text-dim transition-colors duration-200 hover:text-text",
		pill: "absolute inset-0 rounded-[inherit] bg-white/10 shadow-[inset_0_0_0_1px_var(--hairline)]",
		part: "relative grid place-items-center [&_svg]:size-4 [&_img]:size-4.5",
		dot: "relative size-1.25 rounded-full bg-ok",
		extra: "ml-auto flex items-center gap-1.5",
		actions: "ml-auto flex items-center gap-1",
		gear: "grid size-7.5 place-items-center rounded-full text-text-dim transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/8 hover:text-text",
		pin: "grid size-7.5 place-items-center rounded-full text-text-dim transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/8 hover:text-text",
	},
	variants: {
		active: { true: { tab: "text-text" } },
		pinned: { true: { pin: "bg-black/8 dark:bg-white/10 text-text shadow-[inset_0_0_0_1px_var(--hairline)]" } },
		launcher: { true: { tab: "w-7.5 justify-center p-0" } },
		/** Windows Island: floating frosted glass capsule dock. */
		iconsOnly: {
			true: {
				tab: "size-7.5 justify-center rounded-full p-0 text-text-dim transition-all duration-200 hover:text-text hover:scale-108 active:scale-95",
				pill: "rounded-full bg-white dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.1),0_0_0_1.5px_var(--tab-accent)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4),0_0_0_1.5px_var(--tab-accent)] backdrop-blur-xs",
				dot: "absolute -top-0.5 -right-0.5 size-1.75 rounded-full bg-ok shadow-[0_0_0_1.5px_var(--island,#000)] animate-pulse",
				capsule:
					"mx-auto flex items-center gap-1 rounded-full border border-black/[0.05] bg-black/[0.035] px-2 py-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.06] dark:shadow-[0_4px_14px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.08)]",
			},
		},
		bottom: {
			true: { base: "m-0 mt-2.5 w-full justify-between px-1", extra: "ml-1.5" },
		},
	},
	compoundVariants: [
		{ iconsOnly: true, active: true, class: { tab: "text-[var(--tab-accent)] font-bold shadow-xs scale-105" } },
		{ iconsOnly: true, launcher: true, class: { tab: "w-7.5 [--tab-accent:var(--text)]" } },
	],
});

export function Tabs({
	entries,
	current,
	onSelect,
	iconsOnly,
	bottom,
	transition,
	extra,
	pinned,
	onPin,
}: {
	entries: ModuleEntry[];
	current: string | null;
	onSelect: (id: string) => void;
	iconsOnly: boolean;
	/** Below the content (Windows Island): centered. */
	bottom: boolean;
	transition: Transition;
	/** The open module's `tabBarExtra`, shown next to the gear. */
	extra?: ReactNode;
	/** Kept open whatever the pointer does; the pin button sits at the far right. */
	pinned: boolean;
	onPin: (pinned: boolean) => void;
}) {
	const t = useT();
	const s = tabs({ iconsOnly, bottom });
	const pill = <motion.span layoutId="tab-pill" className={s.pill()} transition={transition} />;
	return (
		<div className={s.base()}>
			<div className={s.capsule()}>
				{entries.map(({ module, view }) => {
					const selected = current === module.id;
					return (
						<button
							type="button"
							key={module.id}
							className={s.tab({ active: selected })}
							title={t(module.title)}
							style={{ "--tab-accent": view.accent || "var(--accent)" } as CSSProperties}
							onClick={() => onSelect(module.id)}
						>
							{selected && pill}
							<span className={s.part()}>{view.icon}</span>
							{/* Many modules: only the open tab spells out its name. */}
							{!iconsOnly && selected && <span className={s.part()}>{t(module.title)}</span>}
							{view.active && !selected && <span className={s.dot()} />}
						</button>
					);
				})}
				<button
					type="button"
					className={s.tab({ active: current === LAUNCHER, launcher: true })}
					title={t("layout.launcher")}
					onClick={(e) => {
						e.stopPropagation();
						onSelect(LAUNCHER);
					}}
				>
					{current === LAUNCHER && pill}
					<span className={s.part()}>
						<LayoutGridIcon size={14} />
					</span>
				</button>
			</div>

			{/* Sliders inside: pressing them must not drag the island. */}
			{extra && (
				<div className={s.extra()} data-no-drag>
					{extra}
				</div>
			)}

			<div className={s.actions()}>
				<motion.button
					className={s.gear()}
					title={t("island.settings")}
					whileHover={{ rotate: 45 }}
					whileTap={{ scale: 0.85 }}
					transition={{ type: "spring", stiffness: 300, damping: 15 }}
					onClick={(e) => {
						e.stopPropagation();
						command("open_settings");
					}}
				>
					<SettingsIcon size={15} />
				</motion.button>
				<motion.button
					className={s.pin({ pinned })}
					title={t(pinned ? "island.unpin" : "island.pin")}
					aria-pressed={pinned}
					whileTap={{ scale: 0.85 }}
					onClick={(e) => {
						e.stopPropagation();
						onPin(!pinned);
					}}
				>
					<motion.span
						className="grid place-items-center"
						initial={false}
						animate={{ rotate: pinned ? 0 : 45 }}
						transition={{ type: "spring", stiffness: 300, damping: 18 }}
					>
						<PinIcon size={14} fill={pinned ? "currentColor" : "none"} />
					</motion.span>
				</motion.button>
			</div>
		</div>
	);
}
