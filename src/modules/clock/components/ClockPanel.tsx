import { useMemo, useState, type WheelEvent } from "react";
import { command } from "../../../core/bridge";
import { cn } from "../../../core/cn";
import { useLocale, useT } from "../../../core/i18n";
import { useNow } from "../../ai-agents/common/format";
import { DAY_MS, dayDots, eventsOn, sameDay, startOfDay } from "../events";
import type { CalEvent, CalendarState } from "../types";

/** The wheel over the calendar flips months at most this often. */
const WHEEL_STEP_MS = 220;
/** Event rows under the date; more become "+N". */
const MAX_ROWS = 3;
/** "Join" shows from this long before a call. */
const JOIN_LEAD_MS = 15 * 60_000;

/** First day of the week for a locale (1 = Monday … 7 = Sunday). */
function firstDayOfWeek(locale: string): number {
	try {
		const l = new Intl.Locale(locale) as Intl.Locale & {
			getWeekInfo?: () => { firstDay: number };
			weekInfo?: { firstDay: number };
		};
		return (l.getWeekInfo?.() ?? l.weekInfo)?.firstDay ?? 1;
	} catch {
		return 1;
	}
}

/** ISO week number (Monday weeks; week 1 holds the first Thursday). */
function isoWeek(d: Date): number {
	const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
	const week1 = new Date(t.getFullYear(), 0, 4);
	return 1 + Math.round(((t.getTime() - week1.getTime()) / DAY_MS - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

/** Six rows of seven days covering `month`, starting on the locale's first weekday. */
function monthGrid(month: Date, firstDay: number): Date[] {
	const first = new Date(month.getFullYear(), month.getMonth(), 1);
	const offset = (first.getDay() - (firstDay % 7) + 7) % 7;
	return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - offset + i));
}

const openLink = (url: string | null) => {
	if (url?.startsWith("https://")) command("open_external", { url });
};

/** Clock, the focused day's events, and the month with a dot per calendar on busy days. */
export function ClockPanel({ calendar, highlight }: { calendar?: CalendarState; highlight?: string }) {
	const t = useT();
	const locale = useLocale();
	const now = useNow(1000);
	const today = new Date(now);
	const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
	const [selected, setSelected] = useState<Date | null>(null);

	const events = calendar?.events;
	const calendars = calendar?.calendars;
	const dots = useMemo(() => dayDots(events ?? [], calendars ?? []), [events, calendars]);
	const colors = useMemo(() => new Map((calendars ?? []).map((c) => [c.key, c.color])), [calendars]);
	const hasSources = !!calendars?.length;

	const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(now);
	const seconds = String(today.getSeconds()).padStart(2, "0");
	const firstDay = firstDayOfWeek(locale);
	const days = monthGrid(month, firstDay);
	// Trim a trailing week that belongs entirely to the next month.
	const rows = days.slice(35).every((d) => d.getMonth() !== month.getMonth()) ? 5 : 6;
	const weekdays = days.slice(0, 7).map((d) => new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(d));
	const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month);
	const onCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();

	// Left side: today, or the picked day and how far away it is.
	const focus = selected ?? today;
	const longDate = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(focus);
	const distance = Math.round((startOfDay(focus).getTime() - startOfDay(today).getTime()) / DAY_MS);
	const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(distance, "day");
	// Today lists what's left of it; other days list everything.
	const dayEvents = eventsOn(events ?? [], focus).filter((e) => !sameDay(focus, today) || e.allDay || e.end > now);
	const shown = dayEvents.slice(0, dayEvents.length > MAX_ROWS ? MAX_ROWS - 1 : MAX_ROWS);
	const hourFormat = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });

	const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
	const goToday = () => {
		setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
		setSelected(null);
	};

	const [lastWheel, setLastWheel] = useState(0);
	const onWheel = (e: WheelEvent) => {
		if (Math.abs(e.deltaY) < 4 || e.timeStamp - lastWheel < WHEEL_STEP_MS) return;
		setLastWheel(e.timeStamp);
		shift(Math.sign(e.deltaY));
	};

	const row = (e: CalEvent) => {
		const live = e.start <= now && now < e.end;
		const joinable = !!e.meetingUrl && !e.allDay && e.start - JOIN_LEAD_MS <= now && now < e.end;
		return (
			<li
				key={e.id}
				className={cn(
					"flex h-7.5 cursor-default items-center gap-2 rounded-xl bg-card border border-hairline/60 border-l-[3px] border-l-[var(--cal-color)] px-2.5 text-[12px] shadow-xs hover:border-hairline transition-all duration-200",
					e.id === highlight && "bg-accent/15 border-accent/30",
				)}
				style={{ "--cal-color": colors.get(e.calendar) ?? "#8E8E93" } as React.CSSProperties}
				title={[e.title, e.location].filter(Boolean).join("\n")}
				onClick={() => openLink(e.url)}
			>
				<span
					className={cn(
						"min-w-10 flex-none text-[11px] font-bold text-text-dim tabular-nums",
						live && "text-accent font-extrabold",
					)}
				>
					{e.allDay ? t("calendar.allDay") : e.start < startOfDay(focus).getTime() ? "…" : hourFormat.format(e.start)}
				</span>
				<span className="min-w-0 flex-1 truncate font-medium text-text">{e.title || t("calendar.untitled")}</span>
				{joinable && (
					<button
						type="button"
						className="h-5 flex-none rounded-full bg-accent px-2.5 text-[10.5px] font-bold text-white shadow-xs hover:brightness-110"
						onClick={(ev) => {
							ev.stopPropagation();
							openLink(e.meetingUrl);
						}}
					>
						{t("calendar.join")}
					</button>
				)}
			</li>
		);
	};

	return (
		<div className="flex h-full items-stretch justify-between gap-6 px-1" onClick={(e) => e.stopPropagation()}>
			<div
				className={cn(
					"flex min-w-0 flex-col justify-center gap-1",
					hasSources && "flex-1 justify-start gap-0.75 pt-1.5",
				)}
			>
				<span
					className={cn(
						"text-[40px]/none font-black text-text tracking-tight tabular-nums",
						hasSources && "text-[34px]/none",
					)}
				>
					{time}
					<span className="ml-1.5 text-[15px] font-bold text-text-dim">{seconds}</span>
				</span>
				<span className="text-[13px] font-bold text-text-dim first-letter:uppercase">{longDate}</span>
				<span className="text-[11.5px] font-semibold text-text-dim first-letter:uppercase">
					{selected && !sameDay(selected, today) ? relative : t("clock.week", { n: isoWeek(focus) })}
				</span>
				{hasSources && (
					<ul className="mt-1.5 flex min-w-0 list-none flex-col gap-0.5">
						{shown.map(row)}
						{dayEvents.length > shown.length && (
							<li className="pl-2 text-[11px] font-medium text-text-dim">
								{t("calendar.more", { n: dayEvents.length - shown.length })}
							</li>
						)}
						{dayEvents.length === 0 && (
							<li className="pl-2 text-[11px] font-medium text-text-dim">{t("calendar.free")}</li>
						)}
					</ul>
				)}
			</div>

			<div className="flex w-63 flex-none flex-col justify-center gap-1" data-scroll onWheel={onWheel}>
				<div className="flex h-5.5 items-center gap-1">
					<span className="flex-1 text-[13px] font-bold text-text first-letter:uppercase">{monthLabel}</span>
					{(!onCurrentMonth || selected) && (
						<button
							type="button"
							className="h-5 rounded-[10px] bg-accent/15 px-2 text-[11px] font-bold text-accent hover:bg-accent/25 transition-colors cursor-pointer"
							onClick={goToday}
						>
							{t("clock.today")}
						</button>
					)}
					<button
						type="button"
						className="size-5.5 rounded-full text-[17px] leading-none text-text-dim hover:text-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
						title={t("clock.prev")}
						onClick={() => shift(-1)}
					>
						‹
					</button>
					<button
						type="button"
						className="size-5.5 rounded-full text-[17px] leading-none text-text-dim hover:text-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
						title={t("clock.next")}
						onClick={() => shift(1)}
					>
						›
					</button>
				</div>
				<div className="grid grid-cols-7 gap-x-0.5 gap-y-px">
					{weekdays.map((w, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: weekday labels can repeat (narrow format), and the order is fixed
						<span key={`w${i}`} className="h-3.5 text-center text-[10.5px] font-extrabold text-text-dim uppercase">
							{w}
						</span>
					))}
					{days.slice(0, rows * 7).map((d) => {
						const isToday = sameDay(d, today);
						const classes = cn(
							"relative h-5.25 rounded-[7px] text-[11.5px] font-semibold text-text tabular-nums hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer",
							(d.getDay() === 0 || d.getDay() === 6) && "text-accent font-extrabold",
							d.getMonth() !== month.getMonth() && "opacity-45 text-text-dim",
							selected && sameDay(d, selected) && "shadow-[inset_0_0_0_1.5px_var(--accent)] font-bold",
							isToday && "bg-accent font-black text-white hover:bg-accent shadow-xs",
						);
						const marks = dots.get(d.toDateString());
						return (
							<button
								type="button"
								key={d.toDateString()}
								className={classes}
								onClick={() => {
									setSelected(isToday ? null : d);
									if (d.getMonth() !== month.getMonth()) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
								}}
							>
								{d.getDate()}
								{marks && (
									<span className="pointer-events-none absolute inset-x-0 bottom-px flex justify-center gap-0.5">
										{marks.map((c) => (
											<i key={c} className="size-0.75 rounded-full" style={{ background: isToday ? "#fff" : c }} />
										))}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
