// The panel only draws: the background owns the count (see background.js).
await island.ready;

const count = document.getElementById("count");
const panelTitle = document.getElementById("panel-title");
const add = document.getElementById("add");
const add5 = document.getElementById("add5");
const sub1 = document.getElementById("sub1");
const reset = document.getElementById("reset");
const hint = document.getElementById("hint");

function render() {
	const current = island.state.get()?.count ?? 0;
	count.textContent = String(current);

	panelTitle.textContent = island.t("panel.title");
	const step = island.settings.get("step") || 1;
	add.textContent = island.t("panel.add", { step });
	add5.textContent = island.t("panel.add5");
	sub1.textContent = island.t("panel.sub1");
	reset.textContent = island.t("panel.reset");
	hint.textContent = island.t("panel.hint");
}

const current = () => island.state.get()?.count ?? 0;
add.onclick = () => island.state.set({ count: current() + (island.settings.get("step") || 1) });
add5.onclick = () => island.state.set({ count: current() + 5 });
sub1.onclick = () => island.state.set({ count: Math.max(0, current() - 1) });
reset.onclick = () => island.state.set({ count: 0 });

island.state.subscribe(render);
island.settings.subscribe(render);
island.onLocaleChange(() => location.reload());
render();
