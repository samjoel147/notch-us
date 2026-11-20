import { useProvider } from "../../core/bridge";
import { cn } from "../../core/cn";
import { ACTIVITIES_PROVIDER, type ActivitiesState } from "../../modules/activities/types";

export function PrivacyIndicator({ big }: { big: boolean }) {
	const state = useProvider<ActivitiesState>(ACTIVITIES_PROVIDER);
	const privacy = state?.privacy;
	if (!privacy || (!privacy.micActive && !privacy.cameraActive)) return null;

	return (
		<div
			className={cn(
				"pointer-events-none absolute z-30 flex items-center gap-1.5 transition-all duration-300",
				big ? "top-4 right-5" : "top-1/2 -translate-y-1/2 right-2.5",
			)}
		>
			{privacy.cameraActive && (
				<span className="relative flex size-2 items-center justify-center" title="Camera in use">
					<span className="absolute inline-flex size-full animate-ping rounded-full bg-[#30D158] opacity-60" />
					<span className="relative inline-flex size-1.5 rounded-full bg-[#30D158] shadow-[0_0_6px_#30D158]" />
				</span>
			)}
			{privacy.micActive && (
				<span
					className="relative flex size-2 items-center justify-center"
					title={privacy.micMuted ? "Microphone in use (Muted)" : "Microphone in use"}
				>
					<span
						className={cn(
							"absolute inline-flex size-full animate-ping rounded-full opacity-60",
							privacy.micMuted ? "bg-red-400" : "bg-[#FF9F0A]",
						)}
					/>
					<span
						className={cn(
							"relative inline-flex size-1.5 rounded-full",
							privacy.micMuted ? "bg-red-400 shadow-[0_0_6px_#FF453A]" : "bg-[#FF9F0A] shadow-[0_0_6px_#FF9F0A]",
						)}
					/>
				</span>
			)}
		</div>
	);
}
