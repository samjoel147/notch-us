import { type FormEvent, useState } from "react";
import { Button, LinkButton } from "../../../components/ui/button";
import { Block, Desc, Row } from "../../../components/ui/card";
import { Input, Segmented, Select } from "../../../components/ui/form";
import { command, providerAction, useProvider } from "../../../core/bridge";
import { useT } from "../../../core/i18n";
import { setSetting, useSetting } from "../../../core/settings";
import { MUSIC_PROVIDER } from "../hooks/useMusic";
import type { GlassMaterialId } from "../materials/material.types";
import { type GlowIntensity, musicSettings, type VisualizerStyle } from "../settings";
import type { MusicThemeId } from "../themes/theme.types";

const DASHBOARD_URL = "https://developer.spotify.com/dashboard";
/** Must match `REDIRECT` in `src-tauri/src/providers/music/spotify.rs`. */
const REDIRECT = "http://127.0.0.1:43821/callback";
const ERRORS = [
	"premium",
	"noDevice",
	"unauthorized",
	"network",
	"http",
	"rateLimited",
	"invalid",
	"timeout",
	"denied",
	"portBusy",
	"noClient",
];

interface SpotifyStatus {
	hasClient: boolean;
	connected: boolean;
	error: string | null;
}

const errorText = (t: ReturnType<typeof useT>, code: string) =>
	ERRORS.includes(code) ? t(`music.spotify.error.${code}` as Parameters<typeof t>[0]) : code;

const MATERIALS: { id: GlassMaterialId; name: string; desc: string; preview: string }[] = [
	{
		id: "liquid",
		name: "Liquid Glass",
		desc: "VisionOS fluid optical refraction with specular sheen",
		preview: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.06) 40%, transparent 100%)",
	},
	{
		id: "frosted",
		name: "Frosted Glass",
		desc: "Milky translucent surface with soft light diffusion",
		preview: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.12) 100%)",
	},
	{
		id: "crystal",
		name: "Crystal Glass",
		desc: "Razor-sharp reflective borders with optical clarity",
		preview: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.02) 40%, transparent 80%)",
	},
	{
		id: "smoked",
		name: "Smoked Glass",
		desc: "Dark obsidian translucent surface with rich contrast",
		preview: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)",
	},
	{
		id: "adaptive",
		name: "Adaptive Glass",
		desc: "Dynamically harmonized to current track artwork luminance",
		preview: "linear-gradient(135deg, rgba(160,164,255,0.4) 0%, rgba(30,215,96,0.2) 100%)",
	},
];

/** Notch Pop Media Player Customization & Spotify Account Integration */
export function SpotifySettings() {
	const t = useT();
	const status = useProvider<SpotifyStatus>("spotify");
	const [busy, setBusy] = useState<"connect" | "other" | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [clientId, setClientId] = useState("");

	const material = useSetting(musicSettings.material);
	const theme = useSetting(musicSettings.theme);
	const visualizerStyle = useSetting(musicSettings.visualizerStyle) || "bars";
	const glowIntensity = useSetting(musicSettings.glowIntensity) || "vibrant";

	const run = async (action: string, payload?: unknown, kind: "connect" | "other" = "other") => {
		setBusy(kind);
		setError(null);
		try {
			await providerAction(MUSIC_PROVIDER, action, payload);
			return true;
		} catch (e) {
			const code = String(e);
			if (code !== "cancelled") setError(errorText(t, code));
			return false;
		} finally {
			setBusy(null);
		}
	};

	const saveClient = async (e: FormEvent) => {
		e.preventDefault();
		if (await run("spotifySetClient", { id: clientId })) setClientId("");
	};

	const revoked = status?.error === "unauthorized";
	const description =
		busy === "connect"
			? t("music.spotify.waiting")
			: !status?.hasClient
				? t("music.spotify.noClient")
				: revoked
					? t("music.spotify.revoked")
					: status.connected
						? status.error
							? errorText(t, status.error)
							: t("music.spotify.connected")
						: t("music.spotify.none");

	return (
		<>
			{/* Section 1: Notch Pop Visual & Material Engine */}
			<Block>
				<Row
					label="Optical Glass Material"
					desc="VisionOS-inspired physical optical materials independently applied across all themes."
				/>
				<div className="grid grid-cols-2 gap-2 mt-1 sm:grid-cols-3">
					{MATERIALS.map((mat) => {
						const isSelected = material === mat.id;
						return (
							<button
								type="button"
								key={mat.id}
								className={`group relative flex flex-col items-start gap-1.5 rounded-2xl p-2.5 text-left border transition-all duration-200 ${
									isSelected
										? "border-accent bg-accent/10 shadow-sm"
										: "border-hairline bg-card/60 hover:bg-card hover:border-hairline/80"
								}`}
								onClick={() => setSetting(musicSettings.material, mat.id)}
							>
								<div
									className="relative h-10 w-full rounded-xl overflow-hidden border border-white/20 shadow-xs"
									style={{
										background: mat.preview,
										backdropFilter: mat.id === "frosted" ? "blur(12px)" : "blur(6px)",
									}}
								>
									<div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
									<div className="absolute inset-0 flex items-center justify-center">
										<span className="text-[10.5px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
											{mat.name.split(" ")[0]}
										</span>
									</div>
								</div>
								<div>
									<div className="text-[12.5px] font-semibold text-text">{mat.name}</div>
									<div className="line-clamp-2 text-[10.5px] text-text-dim mt-0.5">{mat.desc}</div>
								</div>
							</button>
						);
					})}
				</div>

				<div className="mt-3">
					<Row label={t("music.visualizerStyle.label")} desc={t("music.visualizerStyle.desc")}>
						<Segmented
							options={[
								{ value: "bars", label: t("music.visualizerStyle.bars") },
								{ value: "wave", label: t("music.visualizerStyle.wave") },
								{ value: "pulse", label: t("music.visualizerStyle.pulse") },
								{ value: "minimal", label: t("music.visualizerStyle.minimal") },
							]}
							value={visualizerStyle}
							onChange={(v) => setSetting(musicSettings.visualizerStyle, v as VisualizerStyle)}
						/>
					</Row>
				</div>

				<Row label={t("music.glowIntensity.label")} desc={t("music.glowIntensity.desc")}>
					<Segmented
						options={[
							{ value: "off", label: t("music.glowIntensity.off") },
							{ value: "subtle", label: t("music.glowIntensity.subtle") },
							{ value: "vibrant", label: t("music.glowIntensity.vibrant") },
							{ value: "immersive", label: t("music.glowIntensity.immersive") },
						]}
						value={glowIntensity}
						onChange={(v) => setSetting(musicSettings.glowIntensity, v as GlowIntensity)}
					/>
				</Row>

				<Row label="Music Player Theme" desc="Visual color personality and atmospheric ambient lighting.">
					<Select value={theme} onChange={(e) => setSetting(musicSettings.theme, e.target.value as MusicThemeId)}>
						<option value="auto">Auto (Match Island Theme)</option>
						<option value="glass-dark">Glass Dark</option>
						<option value="glass-light">Glass Light</option>
						<option value="dark">Dark (Matte Graphite)</option>
						<option value="light">Light (Solid White)</option>
						<option value="cyberpunk">Cyberpunk</option>
						<option value="midnight">Midnight</option>
						<option value="sunset">Sunset</option>
						<option value="aurora">Aurora</option>
					</Select>
				</Row>
			</Block>

			{/* Section 2: Spotify Cloud Provider Integration */}
			<Block>
				<Row
					label={t("music.spotify.title")}
					desc={description}
					descTone={revoked || (status?.connected && status.error) ? "warn" : undefined}
				>
					{busy === "connect" ? (
						<Button onClick={() => providerAction(MUSIC_PROVIDER, "spotifyCancel")}>{t("music.spotify.cancel")}</Button>
					) : status?.connected && !revoked ? (
						<Button variant="danger" disabled={!!busy} onClick={() => run("spotifyDisconnect")}>
							{t("music.spotify.disconnect")}
						</Button>
					) : (
						status?.hasClient && (
							<Button variant="primary" disabled={!!busy} onClick={() => run("spotifyConnect", undefined, "connect")}>
								{t("music.spotify.connect")}
							</Button>
						)
					)}
				</Row>

				{status && !status.hasClient && (
					<>
						<Desc>
							{t("music.spotify.clientHow", { redirect: REDIRECT })}{" "}
							<LinkButton onClick={() => command("open_external", { url: DASHBOARD_URL })}>
								{t("music.spotify.clientOpen")}
							</LinkButton>
						</Desc>
						<form className="flex gap-2" onSubmit={saveClient}>
							<Input
								className="flex-1"
								value={clientId}
								placeholder={t("music.spotify.clientId")}
								spellCheck={false}
								onChange={(e) => setClientId(e.target.value)}
							/>
							<Button variant="primary" disabled={!!busy || !clientId.trim()}>
								{t("music.spotify.clientSave")}
							</Button>
						</form>
					</>
				)}
				{status?.hasClient && !status.connected && (
					<Desc>
						<LinkButton disabled={!!busy} onClick={() => run("spotifyClearClient")}>
							{t("music.spotify.clientRemove")}
						</LinkButton>
					</Desc>
				)}
				{error && <Desc tone="error">{error}</Desc>}
			</Block>
		</>
	);
}
