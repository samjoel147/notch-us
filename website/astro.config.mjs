import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://samjoel147.github.io",
	base: "/notch-us",
	trailingSlash: "ignore",
	i18n: {
		defaultLocale: "en",
		locales: ["en", "pt-br"],
		routing: { prefixDefaultLocale: false },
	},
	vite: {
		// Screenshots, the app icon and the privacy policy live in the repo root.
		server: { fs: { allow: [".."] } },
	},
});
