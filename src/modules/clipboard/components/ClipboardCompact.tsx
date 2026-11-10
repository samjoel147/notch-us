import { CheckIcon, ClipboardIcon, FolderIcon, LockIcon } from "lucide-react";
import { Marquee } from "../../../components/Marquee";
import { cn } from "../../../core/cn";
import { useT } from "../../../core/i18n";
import { useSetting } from "../../../core/settings";
import { clipboardSettings } from "../settings";
import { CLIPBOARD_YELLOW, type ClipItem } from "../types";
import { clipTitle, detectSecret } from "./ClipboardPanel";

/** Left slot of the "just copied" pill: the picture or an icon, and what it is. */
export function ClipboardCompactLeft({ item }: { item: ClipItem }) {
	const t = useT();
	const maskSecrets = useSetting(clipboardSettings.maskSecrets);
	const isSecret = item.kind === "text" && maskSecrets && Boolean(detectSecret(item.preview));

	return (
		<>
			{item.kind === "image" && item.thumb ? (
				<img className="size-6 flex-none rounded-md object-cover" src={item.thumb} alt="" draggable={false} />
			) : (
				<span
					className={cn(
						"grid size-6 flex-none place-items-center rounded-[7px]",
						isSecret ? "bg-[rgba(255,159,10,0.18)]" : "bg-[rgba(255,214,10,0.16)]",
					)}
				>
					{item.kind === "files" ? (
						<FolderIcon size={12} color="#64D2FF" />
					) : isSecret ? (
						<LockIcon size={12} color="#FF9F0A" />
					) : (
						<ClipboardIcon size={12} color={CLIPBOARD_YELLOW} />
					)}
				</span>
			)}
			<Marquee
				text={clipTitle(t, item, maskSecrets)}
				className={cn("max-w-50 min-w-0 text-[13px] font-semibold", isSecret && "font-mono text-[#FF9F0A]")}
			/>
		</>
	);
}

export function ClipboardCompactRight() {
	const t = useT();
	return (
		<span className="inline-flex items-center gap-1 text-[12px] font-semibold whitespace-nowrap text-[#ffd60a]">
			<CheckIcon size={10} /> {t("clipboard.copied")}
		</span>
	);
}
