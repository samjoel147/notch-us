// The panel only draws and logs glasses: the background owns the reminder.
await island.ready;

const glasses = document.getElementById("glasses");
const panelTitle = document.getElementById("panel-title");
const goalStatus = document.getElementById("goal-status");
const next = document.getElementById("next");
const drink = document.getElementById("drink");
const bottle = document.getElementById("bottle");
const undo = document.getElementById("undo");
const ring = document.getElementById("ring");

const CIRCUMFERENCE = 226.19; // 2 * pi * 36

const today = () => new Date().toDateString();
const current = () => {
	const state = island.state.get();
	return state?.day === today() ? state : { day: today(), glasses: 0, dueAt: null };
};

async function render() {
	const state = current();
	const count = state.glasses || 0;
	const target = Math.max(1, Number(island.settings.get("goal") || 8));
	glasses.textContent = String(count);

	const pct = Math.min(100, Math.round((count / target) * 100));
	const offset = CIRCUMFERENCE * (1 - Math.min(1, count / target));
	if (ring) {
		ring.style.strokeDashoffset = String(offset);
		if (count >= target) {
			ring.style.stroke = "var(--island-ok, #34c759)";
		} else {
			ring.style.stroke = "";
		}
	}

	panelTitle.textContent = count >= target ? "🎉 Daily Goal Met!" : island.t("panel.title");
	goalStatus.textContent = island.t("panel.progress", {
		count,
		target,
		pct,
	});

	drink.textContent = island.t("panel.drink");
	bottle.textContent = island.t("panel.bottle");
	undo.textContent = island.t("panel.undo");
	undo.style.display = count > 0 ? "inline-block" : "none";

	const [alarm] = await island.alarms.list();
	next.textContent = alarm
		? island.t("panel.next", { time: new Date(alarm.due).toLocaleTimeString(island.locale, { timeStyle: "short" }) })
		: "";
}

drink.onclick = () => {
	const state = current();
	island.state.set({ ...state, glasses: (state.glasses || 0) + 1, dueAt: null });
};

bottle.onclick = () => {
	const state = current();
	island.state.set({ ...state, glasses: (state.glasses || 0) + 2, dueAt: null });
};

undo.onclick = () => {
	const state = current();
	island.state.set({ ...state, glasses: Math.max(0, (state.glasses || 0) - 1), dueAt: null });
};

island.state.subscribe(render);
island.settings.subscribe(render);
island.onLocaleChange(render);
render();
