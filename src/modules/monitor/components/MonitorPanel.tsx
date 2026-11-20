import { ActivityIcon, ArrowDownIcon, ArrowUpIcon, CpuIcon, LayersIcon, ZapIcon } from "lucide-react";
import { motion } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { providerAction } from "../../../core/bridge";
import { cn } from "../../../core/cn";
import { useLocale, useT } from "../../../core/i18n";
import { useActiveTheme } from "../../../core/theme";
import { levelColor, MONITOR_PROVIDER, type MonitorState, NETWORK_BLUE } from "../types";
import { Sparkline } from "./Sparkline";

const GIB = 1024 ** 3;

export function formatGb(bytes: number, locale: string) {
	const gb = bytes / GIB;
	return `${new Intl.NumberFormat(locale, { maximumFractionDigits: gb >= 10 ? 0 : 1 }).format(gb)} GB`;
}

export function formatRate(bytesPerSec: number, locale: string) {
	const units = ["B/s", "KB/s", "MB/s", "GB/s"];
	let v = bytesPerSec;
	let u = 0;
	while (v >= 1000 && u < units.length - 1) {
		v /= 1024;
		u++;
	}
	return `${new Intl.NumberFormat(locale, { maximumFractionDigits: v >= 100 || u === 0 ? 0 : 1 }).format(v)} ${units[u]}`;
}

interface TileProps {
	icon: ReactNode;
	label: string;
	badge?: string;
	value?: string;
	unit?: string;
	detail?: string;
	color: string;
	chart: ReactNode;
	customContent?: ReactNode;
}

/** CPU, memory, GPU and network, each with its last minute in modern fluid glass. */
export function MonitorPanel({ state }: { state: MonitorState | undefined }) {
	const t = useT();
	const locale = useLocale();
	const { isLight } = useActiveTheme();

	// While the panel is open the backend publishes every sample.
	useEffect(() => {
		providerAction(MONITOR_PROVIDER, "watch", true);
		return () => void providerAction(MONITOR_PROVIDER, "watch", false);
	}, []);

	if (!state || (state.cpu == null && state.memoryUsed == null)) {
		return <div className="grid h-full place-items-center text-[13px] text-text-faint">{t("monitor.loading")}</div>;
	}

	const memory = state.memoryUsed != null && state.memoryTotal ? (state.memoryUsed / state.memoryTotal) * 100 : null;

	const cpuColor = levelColor(state.cpu ?? 0, isLight);
	const memColor = levelColor(memory ?? 0, isLight);
	const gpuColor = levelColor(state.gpu ?? 0, isLight);
	const netColor = isLight ? "#0284c7" : NETWORK_BLUE;

	return (
		<div className="grid h-full grid-cols-4 gap-2">
			{/* CPU */}
			<Tile
				icon={<CpuIcon size={12} className="stroke-[2.2]" />}
				label={t("monitor.cpu")}
				badge={state.cores ? `${state.cores} Cores` : undefined}
				value={state.cpu == null ? "—" : `${Math.round(state.cpu)}`}
				unit={state.cpu == null ? undefined : "%"}
				detail={t("monitor.threads", { n: state.cores })}
				color={cpuColor}
				chart={<Sparkline values={state.history.cpu} color={cpuColor} max={100} />}
			/>

			{/* Memory */}
			<Tile
				icon={<LayersIcon size={12} className="stroke-[2.2]" />}
				label={t("monitor.memory")}
				badge={state.memoryTotal ? `${Math.round(state.memoryTotal / GIB)} GB` : undefined}
				value={memory == null ? "—" : `${Math.round(memory)}`}
				unit={memory == null ? undefined : "%"}
				detail={
					state.memoryUsed != null && state.memoryTotal != null
						? `${formatGb(state.memoryUsed, locale)} / ${formatGb(state.memoryTotal, locale)}`
						: ""
				}
				color={memColor}
				chart={<Sparkline values={state.history.memory} color={memColor} max={100} />}
			/>

			{/* GPU */}
			<Tile
				icon={<ZapIcon size={12} className="stroke-[2.2]" />}
				label={t("monitor.gpu")}
				badge="Engine"
				value={state.gpu == null ? "—" : `${Math.round(state.gpu)}`}
				unit={state.gpu == null ? undefined : "%"}
				detail={state.gpu == null ? t("monitor.unavailable") : "Discrete Core"}
				color={gpuColor}
				chart={<Sparkline values={state.history.gpu} color={gpuColor} max={100} />}
			/>

			{/* Network */}
			<Tile
				icon={<ActivityIcon size={12} className="stroke-[2.2]" />}
				label={t("monitor.network")}
				badge="Live"
				color={netColor}
				customContent={
					<div className="flex flex-col gap-0.5 pt-0.5">
						<div className="flex items-center gap-1.5">
							<ArrowDownIcon size={12} className="stroke-[2.5] text-sky-400" />
							<span className="text-[13px] font-semibold tracking-tight text-text tabular-nums">
								{formatRate(state.down ?? 0, locale)}
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<ArrowUpIcon size={11} className="stroke-[2] text-text-faint" />
							<span className="text-[11px] font-medium text-text-dim tabular-nums">
								{formatRate(state.up ?? 0, locale)}
							</span>
						</div>
					</div>
				}
				chart={<Sparkline values={state.history.down} color={netColor} />}
			/>
		</div>
	);
}

function Tile({ icon, label, badge, value, unit, detail, color, chart, customContent }: TileProps) {
	return (
		<motion.div
			whileHover={{ y: -2 }}
			transition={{ duration: 0.18, ease: "easeOut" }}
			className={cn(
				"group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-[18px] p-2.5 pb-0 transition-all duration-200 select-none",
				"bg-card/75 dark:bg-white/[0.035] backdrop-blur-xl",
				"border border-hairline/80 dark:border-white/[0.07]",
				"shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_4px_14px_rgba(0,0,0,0.12)]",
				"hover:border-black/15 dark:hover:border-white/18 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_6px_20px_rgba(0,0,0,0.2)]",
			)}
		>
			{/* Soft ambient status illumination in upper-right corner */}
			<div
				className="pointer-events-none absolute -top-10 -right-10 size-24 rounded-full opacity-15 blur-xl transition-opacity duration-300 group-hover:opacity-30"
				style={{ backgroundColor: color }}
			/>

			<div className="relative z-10 flex flex-col">
				{/* Header: Clean Icon + Label + Spec Badge */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5">
						<span style={{ color }} className="opacity-90">
							{icon}
						</span>
						<span className="text-[10.5px] font-semibold uppercase tracking-wider text-text-dim/85">{label}</span>
					</div>
					{badge && <span className="text-[9.5px] font-medium text-text-faint/75 tabular-nums">{badge}</span>}
				</div>

				{/* Primary Metric / Custom Stream */}
				{customContent ? (
					<div className="mt-1 flex flex-col">{customContent}</div>
				) : (
					<div className="mt-0.5 flex flex-col">
						<div className="flex items-baseline">
							<span className="text-[22px]/[1.15] font-bold tracking-tight text-text tabular-nums">{value}</span>
							{unit && <span className="ml-0.5 text-[12px] font-medium text-text-faint">{unit}</span>}
						</div>
						<span className="mt-0.5 truncate text-[10.5px] font-medium text-text-dim/80 tabular-nums">
							{detail || "\u00A0"}
						</span>
					</div>
				)}
			</div>

			{/* Organic Telemetry Curve Base */}
			<div className="relative z-0 mt-auto w-full -mb-0.5 overflow-hidden">{chart}</div>
		</motion.div>
	);
}
