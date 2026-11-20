/** Mirrors `Activity` in `src-tauri/src/providers/activities/mod.rs`. */
export interface Activity {
	id: string;
	title: string;
	subtitle: string | null;
	caption: string | null;
	icon: string | null;
	image: string | null;
	color: string | null;
	progress: number | null;
	/** Unix ms; `null` = stays until removed. */
	expiresAt: number | null;
	priority: number;
	action: string | null;
	style: "standard" | "level";
	expand: boolean;
	source: string;
	updatedAt: number;
}

export interface CapturingApp {
	pid: number;
	name: string;
	icon: string | null;
	kind: "mic" | "camera" | "both";
	peak: number;
}

export interface PrivacyState {
	micActive: boolean;
	cameraActive: boolean;
	micMuted: boolean;
	apps: CapturingApp[];
}

export interface ActivitiesState {
	/** Highest priority first. */
	items: Activity[];
	apiPort: number | null;
	/** False on desktops without a battery. */
	hasBattery: boolean;
	privacy?: PrivacyState;
}

export const ACTIVITIES_PROVIDER = "activities";
