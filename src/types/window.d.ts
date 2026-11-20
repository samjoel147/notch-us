export {};

declare global {
	interface Window {
		__emitLocal?: (event: string, payload?: unknown) => void;
		__expandIsland?: (id?: string) => void;
		__playTrack?: (index: number) => void;
		webkitAudioContext?: typeof AudioContext;
	}
}
