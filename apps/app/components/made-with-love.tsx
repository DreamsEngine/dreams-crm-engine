"use client";

import { useEffect, useRef, useState } from "react";

const LINES = [
	{ pre: "Made with love by ", brand: "Dreams Engine", post: "" },
	{ pre: "Hecho con cariño por ", brand: "Dreams Engine", post: "" },
	{ pre: "", brand: "ドリームズエンジン", post: "が心を込めて作りました" },
] as const;

const HOLD_MS = 4000;
const TICK_MS = 45;
const TICKS = 16;

const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const KANA =
	"アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンー";

function charsetFor(target: string): string {
	return /[぀-ヿ一-鿿]/.test(target) ? KANA : LATIN;
}

function frameFor(target: string, progress: number): string {
	const reveal = Math.floor(target.length * progress);
	const charset = charsetFor(target);
	let out = target.slice(0, reveal);
	for (let i = reveal; i < target.length; i++) {
		const wanted = target[i];
		out +=
			wanted === " "
				? " "
				: (charset[Math.floor(Math.random() * charset.length)] ?? wanted);
	}
	return out;
}

type Segments = { pre: string; brand: string; post: string };

export function MadeWithLove({ className }: { className?: string }) {
	const [segments, setSegments] = useState<Segments>(LINES[0]);
	const indexRef = useRef(0);

	useEffect(() => {
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		let hold: ReturnType<typeof setTimeout>;
		let flip: ReturnType<typeof setInterval>;

		const advance = () => {
			const next = LINES[(indexRef.current + 1) % LINES.length] ?? LINES[0];
			indexRef.current = (indexRef.current + 1) % LINES.length;

			if (reduceMotion) {
				setSegments(next);
				hold = setTimeout(advance, HOLD_MS);
				return;
			}

			let tick = 0;
			flip = setInterval(() => {
				tick += 1;
				const progress = Math.min(tick / TICKS, 1);
				setSegments({
					pre: frameFor(next.pre, progress),
					brand: frameFor(next.brand, progress),
					post: frameFor(next.post, progress),
				});
				if (progress >= 1) {
					clearInterval(flip);
					hold = setTimeout(advance, HOLD_MS);
				}
			}, TICK_MS);
		};

		hold = setTimeout(advance, HOLD_MS);
		return () => {
			clearTimeout(hold);
			clearInterval(flip);
		};
	}, []);

	return (
		<p className={className}>
			<span className="sr-only">Made with love by Dreams Engine</span>
			<span aria-hidden="true">
				{segments.pre}
				<a
					href="https://dreamsengine.com"
					target="_blank"
					rel="noreferrer"
					className="underline underline-offset-4 hover:text-foreground"
				>
					{segments.brand}
				</a>
				{segments.post}
			</span>
		</p>
	);
}
