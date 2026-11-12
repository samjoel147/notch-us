export type MessagingPlatformId =
	| "whatsapp"
	| "teams"
	| "instagram"
	| "telegram"
	| "slack"
	| "discord"
	| "phone"
	| "generic";

export interface MessagingPlatform {
	id: MessagingPlatformId;
	name: string;
	brandColor: string;
	glowColor: string;
	canQuickReply: boolean;
	protocolScheme?: string;
	defaultSuggestions: string[];
}

export interface ParsedMessage {
	platform: MessagingPlatform;
	sender: string;
	chatTitle: string | null;
	content: string;
	avatarText: string;
	isDirect: boolean;
}

export const PLATFORMS: Record<MessagingPlatformId, MessagingPlatform> = {
	whatsapp: {
		id: "whatsapp",
		name: "WhatsApp",
		brandColor: "#25D366",
		glowColor: "rgba(37, 211, 102, 0.4)",
		canQuickReply: true,
		protocolScheme: "whatsapp://send",
		defaultSuggestions: ["👍", "❤️", "OK!", "On my way", "Can't talk now"],
	},
	teams: {
		id: "teams",
		name: "Microsoft Teams",
		brandColor: "#505AC9",
		glowColor: "rgba(80, 90, 201, 0.4)",
		canQuickReply: true,
		protocolScheme: "msteams:/l/chat/0/0",
		defaultSuggestions: ["Got it, thanks!", "Looking into this now", "Will join in 5m", "👍"],
	},
	instagram: {
		id: "instagram",
		name: "Instagram",
		brandColor: "#E1306C",
		glowColor: "rgba(225, 48, 108, 0.4)",
		canQuickReply: true,
		protocolScheme: "https://instagram.com/direct/inbox",
		defaultSuggestions: ["❤️", "🔥", "Haha nice!", "Thanks!"],
	},
	telegram: {
		id: "telegram",
		name: "Telegram",
		brandColor: "#2AABEE",
		glowColor: "rgba(42, 171, 238, 0.4)",
		canQuickReply: true,
		protocolScheme: "tg://msg",
		defaultSuggestions: ["👍", "Sure thing", "On it!", "Will reply soon"],
	},
	slack: {
		id: "slack",
		name: "Slack",
		brandColor: "#4A154B",
		glowColor: "rgba(74, 21, 75, 0.4)",
		canQuickReply: true,
		protocolScheme: "slack://open",
		defaultSuggestions: ["👀 Looking", "LGTM! 👍", "Ack", "On it"],
	},
	discord: {
		id: "discord",
		name: "Discord",
		brandColor: "#5865F2",
		glowColor: "rgba(88, 101, 242, 0.4)",
		canQuickReply: true,
		protocolScheme: "discord://",
		defaultSuggestions: ["GG", "👍", "Hold on", "Coming!"],
	},
	phone: {
		id: "phone",
		name: "Phone Link",
		brandColor: "#0078D4",
		glowColor: "rgba(0, 120, 212, 0.4)",
		canQuickReply: true,
		protocolScheme: "ms-phone:",
		defaultSuggestions: ["OK", "Yes", "No", "Call you later"],
	},
	generic: {
		id: "generic",
		name: "Notification",
		brandColor: "#0A84FF",
		glowColor: "rgba(10, 132, 255, 0.35)",
		canQuickReply: true,
		defaultSuggestions: ["OK", "Received", "Thanks"],
	},
};

/** Identifies whether a notification came from a recognized messaging platform. */
export function identifyPlatform(app: string, aumid: string): MessagingPlatform {
	const aumidLower = (aumid || "").toLowerCase();
	const appLower = (app || "").toLowerCase();

	if (aumidLower.includes("whatsapp") || appLower.includes("whatsapp")) {
		return PLATFORMS.whatsapp;
	}
	if (aumidLower.includes("teams") || aumidLower.includes("msteams") || appLower.includes("teams")) {
		return PLATFORMS.teams;
	}
	if (aumidLower.includes("instagram") || appLower.includes("instagram")) {
		return PLATFORMS.instagram;
	}
	if (aumidLower.includes("telegram") || appLower.includes("telegram")) {
		return PLATFORMS.telegram;
	}
	if (aumidLower.includes("slack") || appLower.includes("slack")) {
		return PLATFORMS.slack;
	}
	if (aumidLower.includes("discord") || appLower.includes("discord")) {
		return PLATFORMS.discord;
	}
	if (aumidLower.includes("phonelink") || aumidLower.includes("yourphone") || appLower.includes("phone link")) {
		return PLATFORMS.phone;
	}

	return {
		...PLATFORMS.generic,
		name: app || "Notification",
	};
}

/** Parses incoming notification title and body into structured sender and message content. */
export function parseNotification(app: string, aumid: string, title: string, body: string | null): ParsedMessage {
	const platform = identifyPlatform(app, aumid);
	const cleanTitle = (title || "").trim();
	const cleanBody = (body || "").trim();

	let sender = cleanTitle;
	let chatTitle: string | null = null;
	let content = cleanBody;
	let isDirect = true;

	if (platform.id === "whatsapp") {
		// Group chat pattern: Title is Group Name, Body starts with "Sender: Message"
		if (cleanBody.includes(": ")) {
			const colonIndex = cleanBody.indexOf(": ");
			const potentialSender = cleanBody.slice(0, colonIndex).trim();
			// If title doesn't look like sender, title is the group
			if (potentialSender.length > 0 && potentialSender.length < 35) {
				sender = potentialSender;
				chatTitle = cleanTitle;
				content = cleanBody.slice(colonIndex + 2).trim();
				isDirect = false;
			}
		}
	} else if (platform.id === "teams") {
		// Teams often puts sender in title and message in body, or "Channel > Sender"
		if (cleanTitle.includes(" > ")) {
			const parts = cleanTitle.split(" > ");
			chatTitle = parts[0]?.trim() || null;
			sender = parts[1]?.trim() || sender;
			isDirect = false;
		}
	} else if (platform.id === "instagram") {
		// If title is "Instagram", sender might be in body "Alice sent a message"
		if (cleanTitle.toLowerCase() === "instagram" && cleanBody.includes(" ")) {
			const words = cleanBody.split(" ");
			sender = words[0] || "Instagram User";
			content = cleanBody;
		}
	}

	// Fallback if content is empty
	if (!content && cleanTitle) {
		content = cleanTitle;
	}

	const avatarText =
		sender
			.split(" ")
			.map((w) => w[0])
			.filter(Boolean)
			.slice(0, 2)
			.join("")
			.toUpperCase() ||
		platform.name[0] ||
		"M";

	return {
		platform,
		sender,
		chatTitle,
		content,
		avatarText,
		isDirect,
	};
}
