import { Mic, MicOff } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "../../../components/Glyph";
import { Marquee } from "../../../components/Marquee";
import { providerAction, useProvider } from "../../../core/bridge";
import { cn } from "../../../core/cn";
import { ACTIVITIES_PROVIDER, type ActivitiesState, type Activity } from "../types";
import { AirplaneAlertLeft, AirplaneAlertRight } from "./alerts/AirplaneAlert";
import { BatteryAlertLeft, BatteryAlertRight } from "./alerts/BatteryAlert";
import { BluetoothAlertLeft, BluetoothAlertRight } from "./alerts/BluetoothAlert";
import { BrightnessAlertLeft, BrightnessAlertRight } from "./alerts/BrightnessAlert";
import { LockKeyAlertLeft, LockKeyAlertRight } from "./alerts/LockKeyAlert";
import { ResourceAlertLeft, ResourceAlertRight } from "./alerts/ResourceAlert";
import { VolumeAlertLeft, VolumeAlertRight } from "./alerts/VolumeAlert";
import { WifiAlertLeft, WifiAlertRight } from "./alerts/WifiAlert";

export function getAlertKind(
	a: Activity,
):
	| "battery"
	| "volume"
	| "bluetooth"
	| "keyboard"
	| "wifi"
	| "brightness"
	| "airplane"
	| "resource"
	| "privacy"
	| "standard" {
	if (a.source === "privacy") return "privacy";
	if (
		a.source === "battery" ||
		a.id.includes("battery") ||
		a.id.includes("power_saver") ||
		a.icon === "leaf" ||
		a.icon === "charging"
	)
		return "battery";
	if (a.source === "volume" || a.id.includes("volume") || a.icon === "volume" || a.icon === "mute") return "volume";
	if (
		a.source === "bluetooth" ||
		a.id.includes("bluetooth") ||
		a.icon?.includes("bluetooth") ||
		a.icon?.includes("headphones")
	)
		return "bluetooth";
	if (a.source === "keyboard" || a.id.includes("caps") || a.id.includes("num_lock") || a.icon?.includes("lock"))
		return "keyboard";
	if (a.source === "network" || a.id.includes("wifi") || a.icon?.includes("wifi")) return "wifi";
	if (
		a.source === "brightness" ||
		a.id.includes("brightness") ||
		a.icon?.includes("sun") ||
		a.icon?.includes("brightness")
	)
		return "brightness";
	if (a.id.includes("airplane") || a.id.includes("flight") || a.icon?.includes("plane")) return "airplane";
	if (a.source === "resource" || a.id.includes("monitor") || a.id.includes("cpu") || a.id.includes("ram"))
		return "resource";
	return "standard";
}

/** Left slot of the compact pill: bespoke fluid animation or standard badge + title. */
export function ActivityCompactLeft({ activity: a }: { activity: Activity }) {
	const kind = getAlertKind(a);
	switch (kind) {
		case "battery":
			return <BatteryAlertLeft activity={a} />;
		case "volume":
			return <VolumeAlertLeft activity={a} />;
		case "bluetooth":
			return <BluetoothAlertLeft activity={a} />;
		case "keyboard":
			return <LockKeyAlertLeft activity={a} />;
		case "wifi":
			return <WifiAlertLeft activity={a} />;
		case "brightness":
			return <BrightnessAlertLeft activity={a} />;
		case "airplane":
			return <AirplaneAlertLeft activity={a} />;
		case "resource":
			return <ResourceAlertLeft activity={a} />;
		default:
			return (
				<>
					<Badge icon={a.icon} image={a.image} color={a.color ?? "#ffffff"} size={24} glyphSize={12} />
					{a.style !== "level" && <Marquee text={a.title} className="max-w-50 text-[13px] font-semibold" />}
				</>
			);
	}
}

function PrivacyCompactRight() {
	const state = useProvider<ActivitiesState>(ACTIVITIES_PROVIDER);
	const privacy = state?.privacy;
	const muted = privacy?.micMuted ?? false;

	return (
		<div className="flex items-center gap-1.5 pr-1">
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					providerAction(ACTIVITIES_PROVIDER, "toggleMic");
				}}
				className={cn(
					"flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all duration-200 cursor-pointer active:scale-95",
					muted ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-white/10 text-text-dim hover:bg-white/15",
				)}
				title={muted ? "Unmute microphone (Alt+M)" : "Mute microphone (Alt+M)"}
			>
				{muted ? <MicOff size={11} className="text-red-400" /> : <Mic size={11} className="text-amber-400" />}
				<span>{muted ? "Muted" : "Mute"}</span>
			</button>
		</div>
	);
}

/** Right slot: bespoke fluid metric pill / level bar, or standard level / progress. */
export function ActivityCompactRight({ activity: a }: { activity: Activity }) {
	const kind = getAlertKind(a);
	switch (kind) {
		case "privacy":
			return <PrivacyCompactRight />;
		case "battery":
			return <BatteryAlertRight activity={a} />;
		case "volume":
			return <VolumeAlertRight activity={a} />;
		case "bluetooth":
			return <BluetoothAlertRight activity={a} />;
		case "keyboard":
			return <LockKeyAlertRight activity={a} />;
		case "wifi":
			return <WifiAlertRight activity={a} />;
		case "brightness":
			return <BrightnessAlertRight activity={a} />;
		case "airplane":
			return <AirplaneAlertRight activity={a} />;
		case "resource":
			return <ResourceAlertRight activity={a} />;
		default: {
			const color = a.color ?? "#ffffff";
			if (a.style === "level" && a.progress != null) {
				return (
					<>
						<div className="relative h-1.5 w-24 flex-none overflow-hidden rounded-full bg-white/14">
							<motion.div
								className="absolute inset-0 origin-left rounded-[inherit]"
								style={{ background: color }}
								initial={false}
								animate={{ scaleX: a.progress }}
								transition={{ type: "spring", stiffness: 500, damping: 40 }}
							/>
						</div>
						<span className="min-w-5.5 text-right text-[12px] font-semibold text-text-dim tabular-nums">
							{Math.round(a.progress * 100)}
						</span>
					</>
				);
			}
			return a.progress != null ? (
				<span className="min-w-5.5 text-right text-[12px] font-semibold text-text-dim tabular-nums">
					{Math.round(a.progress * 100)}%
				</span>
			) : null;
		}
	}
}
