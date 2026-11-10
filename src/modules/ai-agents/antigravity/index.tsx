/**
 * Google Antigravity: plan quota, live sessions and tokens.
 * Backend: `src-tauri/src/providers/antigravity.rs`.
 */
import { providerAction } from "../../../core/bridge";
import type { AgentDefinition } from "../common/types";
import { AntigravityIcon } from "./AntigravityIcon";
import { AntigravitySettings } from "./AntigravitySettings";
import { useAntigravity } from "./useAntigravity";

export const antigravityAgent: AgentDefinition = {
	id: "antigravity",
	name: "Antigravity",
	color: "#388BFD",
	Icon: AntigravityIcon,
	useAgent: useAntigravity,
	openSession: (session) => {
		if (session.cwd) providerAction("antigravity", "openProject", session.cwd);
	},
	SettingsSection: AntigravitySettings,
};
