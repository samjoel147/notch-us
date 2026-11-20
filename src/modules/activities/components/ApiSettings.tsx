import { BellIcon } from "lucide-react";
import { Block, Card, Desc, Row } from "../../../components/ui/card";
import { Chip, Chips, Code } from "../../../components/ui/text";
import { useProvider } from "../../../core/bridge";
import { useT } from "../../../core/i18n";
import { readSetting, useSettings } from "../../../core/settings";
import { SliderRow } from "../../../settings/components/SliderRow";
import { ToggleRow } from "../../../settings/components/Toggle";
import { activitySettings } from "../settings";
import { ACTIVITIES_PROVIDER, type ActivitiesState } from "../types";

export function ApiSettings() {
	const t = useT();
	const values = useSettings();
	const state = useProvider<ActivitiesState>(ACTIVITIES_PROVIDER);
	const port = state?.apiPort;
	const duration = readSetting(values, activitySettings.duration);

	const example = `curl -X POST http://127.0.0.1:${port ?? 5199}/notify -H "Content-Type: application/json" -d "{\\"title\\":\\"Deploy done\\",\\"icon\\":\\"check\\",\\"color\\":\\"#30D158\\"}"`;

	return (
		<div className="flex flex-col gap-3.5">
			{/* Pop Notifications Control Deck */}
			<Card>
				<div className="flex items-center gap-2 py-2 border-b border-hairline">
					<BellIcon size={16} className="text-[var(--accent,#38bdf8)]" />
					<span className="text-[13px] font-[650] text-text">
						{t("activities.popAlerts.title") || "Dynamic Island Pop Notifications (12 Occasions)"}
					</span>
				</div>

				<ToggleRow def={activitySettings.charging} value={readSetting(values, activitySettings.charging)} />
				<ToggleRow def={activitySettings.lowBattery} value={readSetting(values, activitySettings.lowBattery)} />
				<ToggleRow def={activitySettings.powerSaver} value={readSetting(values, activitySettings.powerSaver)} />
				<ToggleRow def={activitySettings.volume} value={readSetting(values, activitySettings.volume)} />
				<ToggleRow def={activitySettings.brightness} value={readSetting(values, activitySettings.brightness)} />
				<ToggleRow def={activitySettings.capsLock} value={readSetting(values, activitySettings.capsLock)} />
				<ToggleRow def={activitySettings.numLock} value={readSetting(values, activitySettings.numLock)} />
				<ToggleRow def={activitySettings.wifi} value={readSetting(values, activitySettings.wifi)} />
				<ToggleRow def={activitySettings.airplane} value={readSetting(values, activitySettings.airplane)} />
				<ToggleRow def={activitySettings.resource} value={readSetting(values, activitySettings.resource)} />
				<ToggleRow def={activitySettings.bluetooth} value={readSetting(values, activitySettings.bluetooth)} />
				<ToggleRow def={activitySettings.privacy} value={readSetting(values, activitySettings.privacy)} />
			</Card>

			{/* Alert Duration */}
			<Card>
				<SliderRow
					def={activitySettings.duration}
					value={duration}
					min={1}
					max={6}
					step={0.5}
					unit="s"
					label={t("activities.duration.label") || "Alert Display Duration"}
					desc={
						t("activities.duration.desc") ||
						"How long temporary notifications take over the compact island before smoothly retracting."
					}
				/>
			</Card>

			{/* HTTP API Server */}
			<Card>
				<Block>
					<Row label={t("activities.server.title")} desc={t("activities.server.desc")}>
						<Chips>
							<Chip ok={!!port}>{port ? `127.0.0.1:${port}` : t("activities.server.down")}</Chip>
						</Chips>
					</Row>
					<Code>{example}</Code>
					<Desc>{t("activities.server.routes")}</Desc>
				</Block>
			</Card>
		</div>
	);
}
