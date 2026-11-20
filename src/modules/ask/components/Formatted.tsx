import { CheckIcon, CopyIcon } from "lucide-react";
import { Fragment, type ReactNode, useState } from "react";

const strong = "font-bold text-text";

interface Block {
	kind: "code" | "text";
	content: string;
	lang?: string;
}

function parseBlocks(text: string): Block[] {
	const lines = text.replace(/\r\n?/g, "\n").split("\n");
	const blocks: Block[] = [];
	let inCode = false;
	let currentLang = "";
	let currentCode: string[] = [];
	let currentText: string[] = [];

	for (const line of lines) {
		const trimmed = line.trimStart();
		if (trimmed.startsWith("```")) {
			if (inCode) {
				// End of code block
				blocks.push({ kind: "code", content: currentCode.join("\n"), lang: currentLang });
				currentCode = [];
				inCode = false;
				currentLang = "";
			} else {
				// Start of code block
				if (currentText.length) {
					blocks.push({ kind: "text", content: currentText.join("\n") });
					currentText = [];
				}
				inCode = true;
				currentLang = trimmed.slice(3).trim();
			}
		} else if (inCode) {
			currentCode.push(line);
		} else {
			currentText.push(line);
		}
	}

	if (inCode && currentCode.length) {
		blocks.push({ kind: "code", content: currentCode.join("\n"), lang: currentLang });
	} else if (currentText.length) {
		blocks.push({ kind: "text", content: currentText.join("\n") });
	}

	return blocks;
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="relative my-2 overflow-hidden rounded-xl border border-hairline bg-card/90 shadow-xs">
			<div className="flex items-center justify-between border-b border-hairline px-3 py-1.5 bg-card/95 text-[11px] font-mono text-text-dim">
				<span className="font-semibold uppercase tracking-wider">{lang || "code"}</span>
				<button
					type="button"
					onClick={handleCopy}
					className="flex items-center gap-1.5 hover:text-text cursor-pointer transition-colors"
					title="Copy code"
				>
					{copied ? <CheckIcon size={12} className="text-ok" /> : <CopyIcon size={12} />}
					<span>{copied ? "Copied" : "Copy"}</span>
				</button>
			</div>
			<pre className="overflow-x-auto p-3 text-[12px] font-mono text-text [scrollbar-width:thin] select-text">
				<code>{code}</code>
			</pre>
		</div>
	);
}

/** Markdown parser for chat answers: code blocks, **bold**, `inline code`, bullet lists, and headings. */
export function Formatted({ text }: { text: string }) {
	const blocks = parseBlocks(text);

	return (
		<>
			{blocks.map((block, bi) => {
				if (block.kind === "code") {
					// biome-ignore lint/suspicious/noArrayIndexKey: blocks are append-only
					return <CodeBlock key={bi} code={block.content} lang={block.lang} />;
				}

				const lines = block.content.split("\n");
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: blocks are append-only
					<div key={bi} className="space-y-1">
						{lines.map((raw, i) => {
							const trimmed = raw.trimStart();
							let line = raw;
							let heading = false;
							if (trimmed.startsWith("#")) {
								line = trimmed.replace(/^#+\s*/, "");
								heading = true;
							} else if (/^[-*] /.test(trimmed)) {
								line = `${" ".repeat(raw.length - trimmed.length)}•  ${trimmed.slice(2)}`;
							}
							return (
								// biome-ignore lint/suspicious/noArrayIndexKey: lines derived from text
								<Fragment key={i}>
									{i > 0 && <br />}
									{heading ? <strong className={strong}>{inline(line)}</strong> : inline(line)}
								</Fragment>
							);
						})}
					</div>
				);
			})}
		</>
	);
}

function inline(line: string): ReactNode[] {
	return line
		.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
		.filter(Boolean)
		.map((part, i) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: parts are derived from line
			<Fragment key={i}>{inlinePart(part)}</Fragment>
		));
}

function inlinePart(part: string): ReactNode {
	if (part.length > 4 && part.startsWith("**") && part.endsWith("**"))
		return <strong className={strong}>{part.slice(2, -2)}</strong>;
	if (part.length > 2 && part.startsWith("`") && part.endsWith("`"))
		return (
			<code className="font-mono text-[12px] font-semibold text-accent bg-accent/12 px-1.5 py-0.5 rounded-md border border-accent/25 select-text">
				{part.slice(1, -1)}
			</code>
		);
	return part;
}
