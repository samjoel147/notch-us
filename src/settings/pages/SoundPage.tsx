import { Volume2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, Row } from "../../components/ui/card";
import { Select } from "../../components/ui/form";
import { command } from "../../core/bridge";
import { useT } from "../../core/i18n";
import { readSetting, soundSettings } from "../../core/settings";
import { Title } from "../components/Heading";
import { SliderRow } from "../components/SliderRow";
import { ToggleRow } from "../components/Toggle";

interface AudioDevice {
	id: string;
	name: string;
	is_default?: boolean;
}

export function SoundPage({ values }: { values: Record<string, unknown> }) {
	const t = useT();
	const [devices, setDevices] = useState<AudioDevice[]>([]);
	const [selectedDevice, setSelectedDevice] = useState<string>("default");

	const soundEnabled = readSetting(values, soundSettings.enabled);
	const alertVolume = readSetting(values, soundSettings.volume);

	useEffect(() => {
		command<AudioDevice[]>("get_audio_devices")
			.then((list) => {
				if (list && list.length > 0) {
					setDevices(list);
					const currentDefault = list.find((d) => d.is_default);
					if (currentDefault) setSelectedDevice(currentDefault.id);
				}
			})
			.catch(() => {});
	}, []);

	const handleDeviceChange = (deviceId: string) => {
		setSelectedDevice(deviceId);
		command("set_default_audio_device", { id: deviceId }).catch(() => {});
	};

	return (
		<>
			<Title icon={<Volume2Icon size={20} />}>{t("sound.title") || "Sound & Haptics"}</Title>

			<Card>
				<ToggleRow def={soundSettings.enabled} value={soundEnabled} />
				<SliderRow
					def={soundSettings.volume}
					value={alertVolume}
					min={0}
					max={100}
					step={5}
					unit="%"
					disabled={!soundEnabled}
				/>
			</Card>

			<Card>
				<ToggleRow def={soundSettings.alerts} value={readSetting(values, soundSettings.alerts)} />
				<ToggleRow def={soundSettings.volumeClicks} value={readSetting(values, soundSettings.volumeClicks)} />
				<ToggleRow def={soundSettings.timerChimes} value={readSetting(values, soundSettings.timerChimes)} />
			</Card>

			{devices.length > 0 && (
				<Card>
					<Row
						as="label"
						label={t("sound.outputDevice.label") || "Audio Output Device"}
						desc={
							t("sound.outputDevice.desc") || "Select the default playback device for island notifications and audio."
						}
					>
						<Select
							value={selectedDevice}
							onChange={(e) => handleDeviceChange(e.target.value)}
							disabled={!soundEnabled}
						>
							<option value="default">{t("sound.outputDevice.systemDefault") || "System Default"}</option>
							{devices.map((d) => (
								<option key={d.id} value={d.id}>
									{d.name} {d.is_default ? " (Active)" : ""}
								</option>
							))}
						</Select>
					</Row>
				</Card>
			)}
		</>
	);
}
