import type { MusicState } from "./hooks/useMusic";
import { resolveSourceIdentity } from "./providers/identityResolver";
import { getProviderDefinition, PROVIDER_REGISTRY } from "./providers/registry";
import type { MusicProviderId, ProviderBrandDefinition } from "./providers/types";

export type MusicSourceId = MusicProviderId;
export type MusicSourceDef = ProviderBrandDefinition;
export const SOURCE_DEFS = PROVIDER_REGISTRY;

export function detectMusicSource(music: MusicState | undefined): ProviderBrandDefinition {
	const identity = resolveSourceIdentity(music);
	return getProviderDefinition(identity.providerId);
}
